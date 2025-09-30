import React, { useState, useEffect, useRef } from 'react';
import { FaUsers, FaTrash, FaExchangeAlt, FaUserEdit, FaUserPlus } from 'react-icons/fa';
import { FaUserGraduate } from 'react-icons/fa6';
import { IoIosMore } from 'react-icons/io';
import { supabase } from '../../supabaseClient';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import CreateTeam from '../../services/instructor/CreateTeam';

const MySwal = withReactContent(Swal);

const Teams = () => {
  const [allAccounts, setAllAccounts] = useState([]);
  const allAccountsRef = useRef([]);
  const [managers, setManagers] = useState([]);
  const [students, setStudents] = useState([]);
  const [advisers, setAdvisers] = useState([]);
  const [teamCards, setTeamCards] = useState(() => {
    const saved = localStorage.getItem("teamCards");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeMemberMenu, setActiveMemberMenu] = useState(null);

  useEffect(() => {
    fetchAccounts();
    window.addEventListener("team-click", handleTeamClick);
    return () => window.removeEventListener("team-click", handleTeamClick);
  }, []);

  useEffect(() => {
    localStorage.setItem("teamCards", JSON.stringify(teamCards));
  }, [teamCards]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('user_credentials').select('*');
    if (!error) {
      const adviserGroupedTeamNumbers = new Set(
        data.filter(member => member.adviser_group !== null && member.group_number !== null).map(member => member.group_number)
      );

      const groupedTeams = data.reduce((acc, member) => {
        if (member.group_number !== null && !adviserGroupedTeamNumbers.has(member.group_number)) {
          if (!acc[member.group_number]) {
            acc[member.group_number] = {
              group_number: member.group_number,
              members: [],
            };
          }
          acc[member.group_number].members.push(member);
        }
        return acc;
      }, {});

      const adviserGroups = data.reduce((acc, member) => {
        if (member.adviser_group !== null) {
          if (!acc[member.adviser_group]) {
            acc[member.adviser_group] = {
              adviser: null,
              teams: new Set(),
            };
          }
          if (member.user_roles === 3) {
            acc[member.adviser_group].adviser = member;
          } else if (member.group_number !== null) {
            acc[member.adviser_group].teams.add(member.group_number);
          }
        }
        return acc;
      }, {});

      const teamCardsFromGroups = Object.values(groupedTeams).map(group => {
        const manager = group.members.find(m => m.user_roles === 1);
        const label = `${manager?.last_name || 'Team'}, Et Al`;
        return {
          group_number: group.group_number,
          label,
          adviser_group: null,
        };
      });

      const adviserCards = Object.values(adviserGroups).map(group => {
        const adviser = group.adviser;
        const adviserLabel = adviser
          ? `${adviser.first_name} ${adviser.middle_name || ''} ${adviser.last_name}`
          : 'Adviser Not Found';
        const teams = Array.from(group.teams).map(teamNumber => {
          const teamMembers = data.filter(m => m.group_number === teamNumber);
          const teamManager = teamMembers.find(m => m.user_roles === 1);
          const teamLabel = teamManager ? `${teamManager.last_name}, Et Al` : `Team ${teamNumber}`;
          return {
            group_number: teamNumber,
            group_name: teamLabel,
          };
        });

        return {
          adviser_group: adviser?.adviser_group,
          label: adviserLabel,
          teams,
        };
      });

      setTeamCards([...teamCardsFromGroups, ...adviserCards]);

      setManagers(data.filter((a) => a.user_roles === 1 && a.group_number === null && a.adviser_group === null));
      setStudents(data.filter((s) => s.user_roles === 2 && s.group_number === null && s.adviser_group === null));
      setAdvisers(data.filter((s) => s.user_roles === 3));
      setAllAccounts(data);
      allAccountsRef.current = data;
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      const newRoleId = newRole === 'Project Manager' ? 1 : 2;

      setSelectedTeam(prevTeam => {
        if (!prevTeam) return prevTeam;
        const updatedMembers = prevTeam.members.map(m => {
          if (m.id === memberId) {
            return { ...m, user_roles: newRoleId };
          } else if (m.user_roles === 1) {
            return { ...m, user_roles: 2 };
          }
          return m;
        });

        const manager = updatedMembers.find(m => m.user_roles === 1);
        const otherMembers = updatedMembers.filter(m => m.user_roles !== 1);
        const sortedMembers = manager ? [manager, ...otherMembers] : otherMembers;

        return {
          ...prevTeam,
          members: sortedMembers
        };
      });

      await supabase
        .from('user_credentials')
        .update({ user_roles: 2 })
        .eq('group_number', selectedTeam.group_number)
        .eq('user_roles', 1);

      const { error } = await supabase
        .from('user_credentials')
        .update({ user_roles: newRoleId })
        .eq('id', memberId);

      if (error) {
        throw error;
      }
      setTimeout(fetchAccounts, 500);

    } catch (err) {
      console.error("Error updating role:", err);
      MySwal.fire("Error", "Failed to update role", "error");
      fetchAccounts();
    }
  };

  const handleDeleteFolder = async (team) => {
    MySwal.fire({
      title: `Delete "${team.label}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B0304",
      cancelButtonColor: "#999",
      confirmButtonText: "Yes, delete it",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (team.group_number) {
            await supabase
              .from("user_credentials")
              .update({ group_number: null, group_name: null, adviser_group: null })
              .eq("group_number", team.group_number);
          } else if (team.adviser_group) {
            await supabase
              .from("user_credentials")
              .update({ adviser_group: null })
              .eq("adviser_group", team.adviser_group);

            await supabase
              .from("user_credentials")
              .update({ group_number: null, group_name: null })
              .in("group_number", team.teams.map(t => parseInt(t.group_number)));
          }

          await fetchAccounts();

          MySwal.fire({
            icon: "success",
            title: "Deleted successfully",
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (err) {
          console.error("Error deleting folder:", err);
          MySwal.fire("Error", "Failed to delete folder", "error");
        }
      }
    });
  };

  const handleTeamClick = (e) => {
    const clickedLabel = e.detail;
    const foundTeam = teamCards.find(t => t.label === clickedLabel);
    if (!foundTeam) return;

    if (foundTeam.teams && foundTeam.teams.length > 0) {
      const teamButtons = foundTeam.teams.map((team) => {
        const teamMembers = allAccountsRef.current.filter(m => m.group_number === team.group_number);
        const teamManager = teamMembers.find(m => m.user_roles === 1);
        const teamLabel = teamManager ? `${teamManager.last_name}, Et Al` : team.group_name;

        return `
          <div class="team-folder-btn group-card" data-team-number="${team.group_number}" data-team-label="${teamLabel}" style="
            position: relative;
            width: 100%;
            height: 14rem;
            border-radius: 0.75rem;
            border: 1px solid #e5e7eb;
            background-color: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: box-shadow 0.3s ease;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          ">
            <div style="
              position: absolute;
              top: 0.5rem;
              right: 0.5rem;
              z-index: 10;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0.25rem;
            ">
              <button class="more-btn" style="
                color: #3B0304;
                font-size: 1.5rem;
                font-weight: 700;
                background-color: transparent;
                border: none;
                padding: 0.25rem;
                border-radius: 9999px;
                cursor: pointer;
                transition: background-color 0.2s;
              ">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-horizontal" style="transform: rotate(90deg);"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
            </div>
 
            <div style="
              width: 100%;
              flex-grow: 1;
              background-color: white;
              padding: 1rem;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              border-top-left-radius: 0.75rem;
              border-top-right-radius: 0.75rem;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users" style="color: #000; margin-bottom: 1rem;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span style="font-weight: 700; color: #3B0304; font-size: 0.875rem;">${teamLabel}</span>
            </div>
            <div style="width: 100%; height: 20%; background-color: #830C18; border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem;"></div>

            <div class="card-menu hidden" style="
              display: none;
              position: absolute;
              top: 2rem;
              right: 0.5rem;
              z-index: 20;
              background-color: white;
              border: 1px solid #e5e7eb;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              width: 10rem;
              flex-direction: column;
              font-size: 0.875rem;
            ">
              <button class="menu-delete-btn" data-team-number="${team.group_number}" style="
                width: 100%;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                text-align: left;
                color: #000;
                background-color: white;
                border: none;
                cursor: pointer;
                transition: background-color 0.2s;
              ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                Delete Team
              </button>
              <button class="menu-transfer-btn" data-team-number="${team.group_number}" style="
                width: 100%;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                text-align: left;
                color: #000;
                background-color: white;
                border: none;
                cursor: pointer;
                transition: background-color 0.2s;
              ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right-left"><path d="M8 3L4 7L8 11"/><path d="M4 7h16"/><path d="M16 21l4-4l-4-4"/><path d="M20 17H4"/></svg>
                Transfer Team
              </button>
            </div>
          </div>
        `;
      }).join('');

      MySwal.fire({
        title: `<div style='color:#3B0304;'>📁 ${foundTeam.label}</div>`,
        html: `<div id="adviserTeamList" style="text-align:left; max-height: 300px; overflow-y:auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1rem;">${teamButtons}</div>`,
        showConfirmButton: false,
        width: 800,
        didOpen: () => {
          const container = Swal.getPopup().querySelector('#adviserTeamList');

          container.querySelectorAll('.group-card').forEach(card => {
            const moreBtn = card.querySelector('.more-btn');
            const menu = card.querySelector('.card-menu');

            moreBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              document.querySelectorAll('.card-menu').forEach(m => m.style.display = 'none');
              menu.style.display = 'flex';
            });

            card.addEventListener('click', (e) => {
              if (e.target.closest('.more-btn') || e.target.closest('.card-menu')) return;
              const innerTeamNumber = card.getAttribute('data-team-number');
              const groupMembers = allAccountsRef.current.filter(s => s.group_number === parseInt(innerTeamNumber));
              const manager = groupMembers.find(m => m.user_roles === 1);
              const members = groupMembers.filter(m => m.user_roles === 2);

              const sortedMembers = manager ? [manager, ...members] : members;

              setSelectedTeam({
                group_number: parseInt(innerTeamNumber),
                label: card.getAttribute('data-team-label'),
                members: sortedMembers
              });

              MySwal.close();
            });

            card.querySelector('.menu-delete-btn').addEventListener('click', (e) => {
              e.stopPropagation();
              const teamNumber = e.currentTarget.getAttribute('data-team-number');
              const teamLabel = card.getAttribute('data-team-label');
              const targetTeam = { group_number: parseInt(teamNumber), label: teamLabel };
              MySwal.close();
              handleDeleteFolder(targetTeam);
            });

            card.querySelector('.menu-transfer-btn').addEventListener('click', (e) => {
              e.stopPropagation();
              const teamNumber = e.currentTarget.getAttribute('data-team-number');
              const teamLabel = card.getAttribute('data-team-label');
              const targetTeam = { group_number: parseInt(teamNumber), label: teamLabel };
              MySwal.close();
              handleTransferTeam(targetTeam);
            });
          });

          document.addEventListener('click', (e) => {
            if (!e.target.closest('.card-menu') && !e.target.closest('.more-btn')) {
              document.querySelectorAll('.card-menu').forEach(m => m.style.display = 'none');
            }
          });
        }
      });
    } else {
      const groupMembers = allAccounts.filter(s => s.group_number === foundTeam.group_number);
      const manager = groupMembers.find(m => m.user_roles === 1);
      const otherMembers = groupMembers.filter(m => m.user_roles !== 1);
      const sortedMembers = manager ? [manager, ...otherMembers] : otherMembers;

      setSelectedTeam({ ...foundTeam, members: sortedMembers });
    }
  };

  const handleAddMember = async () => {
    const unassignedStudents = allAccountsRef.current.filter(
      s => s.user_roles === 2 && s.group_number === null && s.adviser_group === null
    );

    if (unassignedStudents.length === 0) {
      MySwal.fire("No available students", "All students are already assigned to groups.", "info");
      return;
    }

    const options = {};
    unassignedStudents.forEach(student => {
      options[student.id] = `${student.last_name}, ${student.first_name} ${student.middle_name || ''}`;
    });
    MySwal.fire({
      title: 'Add Member',
      input: 'select',
      inputOptions: options,
      inputPlaceholder: 'Select a student to add',
      showCancelButton: true,
      confirmButtonText: 'Add Member',
      width: '600px',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to select a student!';
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const studentId = result.value;
        try {
          const { error } = await supabase
            .from("user_credentials")
            .update({ group_number: selectedTeam.group_number, group_name: selectedTeam.label })
            .eq("id", studentId);

          if (error) throw error;

          const newMember = unassignedStudents.find(s => s.id === studentId);
          setSelectedTeam(prevTeam => ({
            ...prevTeam,
            members: [...prevTeam.members, newMember]
          }));

          setTimeout(fetchAccounts, 500);

        } catch (error) {
          MySwal.fire(
            'Error',
            'Failed to add student to team.',
            'error'
          );
          console.error('Error adding member:', error);
          fetchAccounts();
        }
      }
    });
  };
  
  const handleAssignAdviser = () => {
    let selectedTeams = [];
    const eligibleTeams = teamCards.filter(tc => !tc.adviser_group);

    MySwal.fire({
      title: '<div style="color: #3B0304; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="bi bi-person-lines-fill"></i> Assign Adviser</div>',
      html: `
        <div style="display: flex; gap: 20px; margin-bottom: 15px;">
          <div style="flex: 1;">
            <label style="font-weight: 600;">Team's</label>
            <select id="teamSelect" class="form-select">
              <option disabled selected>Select</option>
              ${eligibleTeams.map(team => `<option value="${team.group_number}">${team.label}</option>`).join('')}
            </select>
          </div>
          <div style="flex: 1;">
            <label style="font-weight: 600;">Advisers</label>
            <select id="adviserSelect" class="form-select">
              <option disabled selected>Select</option>
              ${advisers.map((a) => {
                return `<option value="${a.id}">
                  ${a.last_name}, ${a.first_name} ${a.middle_name || ''} 
                  ${a.adviser_group ? `(Group ${a.adviser_group})` : ''}
                </option>`;
              }).join('')}
            </select>
          </div>
        </div>
        <div style="border: 1px solid #ccc; border-radius: 12px; padding: 12px; max-height: 150px; overflow-y: auto;">
          <strong style="display: block; margin-bottom: 8px;">Selected Teams</strong>
          <div id="selectedTeamList" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>
        </div>`,
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3B0304',
      cancelButtonColor: '#999',
      width: '600px', 
      didOpen: () => {
        const teamSelect = Swal.getPopup().querySelector('#teamSelect');
        const listDiv = Swal.getPopup().querySelector('#selectedTeamList');

        teamSelect.addEventListener('change', () => {
          const value = teamSelect.value;
          const label = teamSelect.options[teamSelect.selectedIndex].text;
          if (!selectedTeams.includes(value)) {
            selectedTeams.push(value);
            const tag = document.createElement('div');
            tag.style.cssText = 'background:#f8f8f8; border-radius:8px; padding:4px 8px; font-size:14px; border:1px solid #ccc; display:flex; align-items:center; gap:6px;';
            tag.innerHTML = `<span>${label}</span><button style="border:none; background:none; font-size:16px; cursor:pointer;">×</button>`;
            tag.querySelector('button').addEventListener('click', () => {
              tag.remove();
              selectedTeams = selectedTeams.filter(id => id !== value);
            });
            listDiv.appendChild(tag);
          }
        });
      },
      preConfirm: () => {
        const adviserId = Swal.getPopup().querySelector('#adviserSelect').value;
        if (!adviserId) {
          Swal.showValidationMessage('Adviser must be selected');
          return false;
        }
        if (selectedTeams.length === 0) {
          Swal.showValidationMessage('At least one team must be selected');
          return false;
        }
        return { adviserId, selectedTeams };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { adviserId, selectedTeams } = result.value;

        const { data: adviserData } = await supabase
          .from("user_credentials")
          .select("adviser_group")
          .eq("id", adviserId)
          .single();

        let adviserGroupId = adviserData?.adviser_group;

        if (!adviserGroupId) {
          const { data: existing } = await supabase.from("user_credentials").select("adviser_group");
          const currentGroups = existing.map(e => e.adviser_group).filter(e => e !== null);
          adviserGroupId = currentGroups.length > 0 ? Math.max(...currentGroups) + 1 : 1;

          await supabase.from("user_credentials")
            .update({ adviser_group: adviserGroupId })
            .eq("id", adviserId);
        }

        for (const groupId of selectedTeams) {
          await supabase.from("user_credentials")
            .update({ adviser_group: adviserGroupId })
            .eq("group_number", parseInt(groupId));
        }

        await fetchAccounts();

        MySwal.fire({
          icon: 'success',
          title: '✓ Adviser assigned',
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  };
  const handleCardMenuToggle = (index) => {
    setActiveMenu((prev) => (prev === index ? null : index));
  };

  const handleMemberMenuToggle = (index) => {
    setActiveMemberMenu((prev) => (prev === index ? null : index));
  };

  const handleDeleteMember = async (memberId) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setSelectedTeam(prevTeam => ({
            ...prevTeam,
            members: prevTeam.members.filter(m => m.id !== memberId)
          }));

          const { error } = await supabase
            .from("user_credentials")
            .update({ group_number: null, group_name: null })
            .eq("id", memberId);

          if (error) {
            throw error;
          }

          setTimeout(fetchAccounts, 500);

        } catch (error) {
          MySwal.fire(
            'Error',
            'Failed to delete member.',
            'error'
          );
          console.error('Error deleting member:', error);
          fetchAccounts();
        }
      }
    });
  };

  const handleTransferMember = async (memberId) => {
    const { data: teams, error } = await supabase
      .from('user_credentials')
      .select('group_number, group_name')
      .not('group_number', 'is', null)
      .not('group_name', 'is', null)
      .neq('group_number', selectedTeam.group_number);

    if (error) {
      console.error('Error fetching teams:', error);
      MySwal.fire('Error', 'Failed to fetch teams for transfer.', 'error');
      return;
    }

    const uniqueTeams = Array.from(new Set(teams.map(t => t.group_number)))
      .map(group_number => {
        const team = teams.find(t => t.group_number === group_number);
        return {
          group_number: team.group_number,
          group_name: team.group_name
        };
      });

    const options = {};
    uniqueTeams.forEach(team => {
      options[team.group_number] = team.group_name;
    });

    MySwal.fire({
      title: 'Transfer Member',
      input: 'select',
      inputOptions: options,
      inputPlaceholder: 'Select a new team',
      showCancelButton: true,
      confirmButtonText: 'Transfer',
      width: '600px', 
      inputValidator: (value) => {
        if (!value) {
          return 'You need to select a team!';
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const newGroupNumber = result.value;
        const newTeam = uniqueTeams.find(t => t.group_number.toString() === newGroupNumber);

        try {
          const { error } = await supabase
            .from("user_credentials")
            .update({ group_number: newGroupNumber, group_name: newTeam.group_name })
            .eq("id", memberId);

          if (error) {
            throw error;
          }

          const memberToTransfer = selectedTeam.members.find(m => m.id === memberId);
          setSelectedTeam(prevTeam => ({
            ...prevTeam,
            members: prevTeam.members.filter(m => m.id !== memberId)
          }));

          setTimeout(fetchAccounts, 500);

        } catch (error) {
          MySwal.fire(
            'Error',
            'Failed to transfer member.',
            'error'
          );
          console.error('Error transferring member:', error);
          fetchAccounts(); 
        }
      }
    });
  };

  const handleTransferTeam = async (team) => {
    MySwal.fire({
      title: `Transfer "${team.label}"?`,
      text: "Select a new adviser to transfer this team to.",
      html: `
        <div style="margin-top: 20px;">
          <label style="font-weight: 600;">Advisers</label>
          <select id="transferAdviserSelect" class="form-select">
            <option disabled selected value="">Select</option>
            ${advisers.map(a => `<option value="${a.id}">${a.last_name}, ${a.first_name} ${a.middle_name || ''}</option>`).join('')}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Transfer',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3B0304',
      cancelButtonColor: '#999',
      width: '600px', 
      preConfirm: () => {
        const newAdviserId = Swal.getPopup().querySelector('#transferAdviserSelect').value;
        if (!newAdviserId) {
          Swal.showValidationMessage('Please select an adviser.');
          return false;
        }
        return newAdviserId;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const newAdviserId = result.value;
        try {
          const { data: newAdviserData } = await supabase
            .from("user_credentials")
            .select("adviser_group")
            .eq("id", newAdviserId)
            .single();

          let newAdviserGroupId = newAdviserData?.adviser_group;

          if (!newAdviserGroupId) {
            const { data: existing } = await supabase.from("user_credentials").select("adviser_group");
            const currentGroups = existing.map(e => e.adviser_group).filter(e => e !== null);
            newAdviserGroupId = currentGroups.length > 0 ? Math.max(...currentGroups) + 1 : 1;

            await supabase.from("user_credentials")
              .update({ adviser_group: newAdviserGroupId })
              .eq("id", newAdviserId);
          }

          await supabase
            .from("user_credentials")
            .update({ adviser_group: newAdviserGroupId })
            .eq("group_number", team.group_number);

          await fetchAccounts();

          MySwal.fire({
            icon: 'success',
            title: 'Team transferred successfully!',
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (err) {
          console.error("Error transferring team:", err);
          MySwal.fire("Error", "Failed to transfer team", "error");
        }
      }
    });
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-xl font-bold flex items-center gap-2 text-[#3B0304] mb-1">
        <FaUsers /> Teams
      </h1>

      <div className="w-[calc(100%-1rem)] border-b border-[#3B0304] mt-2 mb-4"></div>

      <div className="flex gap-2 mb-6">
        <CreateTeam managerList={students} studentList={students} onTeamCreated={fetchAccounts} />
        <button
          onClick={() => handleAssignAdviser()}
          className="px-4 py-2 bg-[#3B0304] text-white rounded-lg shadow hover:bg-[#5c1b1c] transition"
        >
          + Assign Adviser
        </button>
      </div>
      {selectedTeam ? (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <button
            onClick={() => setSelectedTeam(null)}
            className="mb-4 px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] transition hover:bg-white hover:text-black"
          >
            &larr; Back
          </button>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#3B0304]">Team: {selectedTeam.label}</h2>
            <button
              onClick={handleAddMember}
              className="px-4 py-2 bg-white text-black rounded-lg shadow-sm border border-[#B2B2B2] flex items-center gap-2 transition hover:bg-white hover:text-black"
            >
              <FaUserPlus /> Add Member
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NO
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID NO
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LAST NAME
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FIRST NAME
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MIDDLE NAME
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROLE
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedTeam.members.map((member, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.id_no || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.first_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.middle_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={member.user_roles === 1 ? 'Project Manager' : 'Member'}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className="p-2 border border-[#B2B2B2] rounded-lg bg-white text-[#3B0304] font-semibold"
                        disabled={member.user_roles === 1 && selectedTeam.members.filter(m => m.user_roles === 1).length === 1}
                      >
                        <option value="Project Manager">Project Manager</option>
                        <option value="Member">Member</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMemberMenuToggle(index);
                          }}
                          className="text-[#3B0304] text-xl font-bold bg-transparent border-none focus:outline-none p-1 rounded-full hover:bg-gray-100"
                        >
                          <IoIosMore style={{ transform: 'rotate(90deg)' }} />
                        </button>
                        {activeMemberMenu === index && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute z-10 mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-md w-40 text-sm flex flex-col"
                          >
                            <button
                              onClick={() => {
                                handleDeleteMember(member.id);
                                setActiveMemberMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-left text-black bg-white focus:outline-none"
                            >
                              <FaTrash /> Delete
                            </button>
                            <button
                              onClick={() => {
                                handleTransferMember(member.id);
                                setActiveMemberMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-left text-black bg-white focus:outline-none"
                            >
                              <FaExchangeAlt /> Transfer Member
                            </button>
                          </div>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {teamCards.length === 0 ? (
            <p className="text-gray-500">No teams available.</p>
          ) : (
            teamCards.map((team, idx) => {
              if (team.adviser_group) {
                const adviserNameParts = team.label.split(' ');
                const lastName = adviserNameParts.pop();
                const remainingName = adviserNameParts.join(' ');
                return (
                  <div
                    key={idx}
                    className="relative w-full h-56 rounded-xl border border-gray-200 bg-white shadow-md hover:shadow-lg transition cursor-pointer flex"
                    onClick={() => handleTeamClick({ detail: team.label })}
                  >
                    <div className="absolute top-2 right-2 z-10 flex flex-col items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardMenuToggle(idx);
                        }}
                        className="text-[#3B0304] text-xl font-bold bg-transparent border-none focus:outline-none p-1 rounded-full hover:bg-gray-100"
                      >
                        <IoIosMore style={{ transform: 'rotate(90deg)' }} />
                      </button>
                      {activeMenu === idx && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-10 mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-md w-40 text-sm flex flex-col"
                        >
                          <button
                            onClick={() => {
                              handleDeleteFolder(team);
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-black bg-white focus:outline-none"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="w-[20%] h-full bg-[#3B0304] rounded-l-xl"></div>
                    <div className="w-[80%] h-full bg-white p-4 flex flex-col items-center justify-center text-center rounded-r-xl">
                      <FaUserGraduate className="text-black text-4xl mb-4" />
                      <span className="font-bold text-[#3B0304] text-sm">
                        {remainingName}<br />
                        {lastName}
                      </span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={idx} className="relative w-full h-56 rounded-xl border border-gray-200 bg-white shadow-md hover:shadow-lg transition cursor-pointer flex flex-col" onClick={() => handleTeamClick({ detail: team.label })}>
                    <div className="absolute top-2 right-2 z-10 flex flex-col items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardMenuToggle(idx);
                        }}
                        className="text-[#3B0304] text-xl font-bold bg-transparent border-none focus:outline-none p-1 rounded-full hover:bg-gray-100"
                      >
                        <IoIosMore style={{ transform: 'rotate(90deg)' }} />
                      </button>
                      {activeMenu === idx && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-10 mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-md w-40 text-sm flex flex-col"
                        >
                          <button
                            onClick={() => {
                              handleDeleteFolder(team);
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-black bg-white focus:outline-none"
                          >
                            <FaTrash /> Delete
                          </button>
                          <button
                            onClick={() => {
                              handleTransferTeam(team);
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-black bg-white focus:outline-none"
                          >
                            <FaExchangeAlt /> Transfer Team
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="w-full flex-grow bg-white p-4 flex flex-col items-center justify-center text-center rounded-t-xl">
                      <FaUsers className="text-black text-4xl mb-4" />
                      <span className="font-bold text-[#3B0304] text-sm">{team.label}</span>
                    </div>
                    <div className="w-full h-[20%] bg-[#830C18] rounded-b-xl"></div>
                  </div>
                );
              }
            })
          )}
        </div>
      )}
    </div>
  ); 
};
export default Teams;
import React from 'react';
import { supabase } from '../../supabaseClient';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
 
const MySwal = withReactContent(Swal);
 
const CreateTeam = ({ managerList, studentList, onTeamCreated }) => {
 
  const handleCreateTeam = () => {
    if (studentList.length === 0) {
      MySwal.fire("No available students", "All students are already assigned to groups.", "info");
      return;
    }
 
    let selectedMembers = [];
    const availableStudents = [...studentList]; // Create a mutable copy

    MySwal.fire({
      title: `<div style="color: #3B0304; font-weight: 600; display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-plus-circle"></i> Create Team</div>`,
      html: `
        <div style="display: flex; gap: 20px; margin-bottom: 15px;">
          <div style="flex: 1;">
            <label style="font-weight: 600;">Project Manager</label>
            <select id="pmSelect" class="form-select">
              <option disabled selected value="">Select</option>
              ${availableStudents.map((s) => `<option value="${s.id}">${s.last_name}, ${s.first_name} ${s.middle_name || ''}</option>`).join('')}
            </select>
          </div>
          <div style="flex: 1;">
            <label style="font-weight: 600;">Team Name</label>
            <input id="teamName" class="form-control" placeholder="Enter team name" style="border-radius: 12px; height: 42px;" disabled />
          </div>
        </div>
 
        <div style="margin-bottom: 12px;">
          <label style="font-weight: 600;">Members</label>
          <select id="memberSelect" class="form-select">
            <option disabled selected>Select</option>
            ${availableStudents.map((s) => `<option value="${s.id}">${s.last_name}, ${s.first_name} ${s.middle_name || ''}</option>`).join('')}
          </select>
        </div>
 
        <div style="border: 1px solid #ccc; border-radius: 12px; padding: 12px; margin-top: 10px; max-height: 180px; overflow-y: auto;">
          <strong style="display: block; margin-bottom: 8px;">Members List</strong>
          <div id="memberListItems" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;"></div>
        </div>`,
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3B0304',
      cancelButtonColor: '#999',
      width: '600px',
      didOpen: () => {
        const pmSelect = Swal.getPopup().querySelector('#pmSelect');
        const teamNameInput = Swal.getPopup().querySelector('#teamName');
        const memberSelect = Swal.getPopup().querySelector('#memberSelect');
        const memberList = Swal.getPopup().querySelector('#memberListItems');
        let initialMembers = [...availableStudents];

        const updateMemberDropdown = () => {
  // Generate the options string, starting with the "Select" option
  const optionsHtml = `<option disabled selected value="">Select</option>` + initialMembers.map(s => `<option value="${s.id}">${s.last_name}, ${s.first_name} ${s.middle_name || ''}</option>`).join('');
  memberSelect.innerHTML = optionsHtml;
};
 
        pmSelect.addEventListener('change', () => {
          const selectedPMId = pmSelect.value;
          const selectedOption = pmSelect.options[pmSelect.selectedIndex];
          const lastName = selectedOption.textContent.split(',')[0].trim();
          teamNameInput.value = `${lastName}, Et Al.`;
          
          initialMembers = availableStudents.filter(s => s.id !== selectedPMId);
          selectedMembers = [];
          memberList.innerHTML = '';
          updateMemberDropdown();
        });
 
        memberSelect.addEventListener('change', () => {
          const selectedId = memberSelect.value;
          const selectedText = memberSelect.options[memberSelect.selectedIndex].text;
 
          if (!selectedMembers.includes(selectedId)) {
            selectedMembers.push(selectedId);
 
            const div = document.createElement('div');
            div.style.cssText =
              'background: #f8f8f8; border-radius: 8px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between; border: 1px solid #ddd;';
            div.innerHTML = `<span style="font-size: 14px;">${selectedText}</span><button class="btn" style="border: none; background: none; color: #3B0304; font-weight: bold; font-size: 18px; cursor: pointer;">⨉</button>`;
            
            div.querySelector('button').addEventListener('click', () => {
              div.remove();
              selectedMembers = selectedMembers.filter(id => id !== selectedId);
              const removedMember = availableStudents.find(s => s.id === selectedId);
              initialMembers.push(removedMember);
              initialMembers.sort((a, b) => a.last_name.localeCompare(b.last_name));
              updateMemberDropdown();
            });
 
            memberList.appendChild(div);
            initialMembers = initialMembers.filter(s => s.id !== selectedId);
            updateMemberDropdown();
          }
        });
      },
      preConfirm: () => {
        const managerId = Swal.getPopup().querySelector('#pmSelect').value;
        const teamName = Swal.getPopup().querySelector('#teamName').value.trim();
 
        if (!managerId) {
          Swal.showValidationMessage('Project Manager is required.');
          return false;
        }

        if (!teamName) {
          Swal.showValidationMessage('Team name is required.');
          return false;
        }
 
        if (selectedMembers.length === 0) {
          Swal.showValidationMessage('At least one member must be selected.');
          return false;
        }
 
        return { managerId, teamName, selectedMembers };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { managerId, teamName, selectedMembers } = result.value;
 
        try {
          const { data: groupData } = await supabase.from("user_credentials").select("group_number");
          const allGroups = groupData.map((s) => s.group_number).filter((g) => g !== null);
          const nextGroup = allGroups.length > 0 ? Math.max(...allGroups) + 1 : 1;
 
          // Update the selected PM's role and group details
          await supabase.from("user_credentials").update({ user_roles: 1, group_number: nextGroup, group_name: teamName }).eq("id", managerId);
 
          // Update the members' group details
          for (const studentId of selectedMembers) {
            await supabase.from("user_credentials").update({ group_number: nextGroup, group_name: teamName }).eq("id", studentId);
          }
 
          onTeamCreated();
 
          MySwal.fire({
            icon: 'success',
            title: '✓ Team folder created',
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (error) {
          console.error("Error creating team:", error);
          MySwal.fire('Error', 'Failed to create team.', 'error');
        }
      }
    });
  };
 
  return (
    <button
      onClick={handleCreateTeam}
      className="px-4 py-2 bg-[#3B0304] text-white rounded-lg shadow hover:bg-[#5c1b1c] transition"
    >
      + Create Team
    </button>
  );
};
 
export default CreateTeam;
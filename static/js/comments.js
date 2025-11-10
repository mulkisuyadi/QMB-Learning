//Extra clarifications / tips

//querySelectorAll() returns a NodeList of DOM elements currently in the page (the DOM). It does not read JSON. JSON must be parsed and converted into DOM elements first.

//s, b, tc are just variable names for each element in the .forEach() loops. You can rename them to clearer names if you want (sectionEl, btn, pane).

//if (!target) return; is a guard that prevents the rest of the code from running when getElementById returned null. Without it you’d get errors like Cannot read property 'style' of null.

//.dataset.tab reads the value of the HTML attribute data-tab="...".

//The code toggles display inline style for sections but uses classList.add('active')/remove('active') for tabs and panes. That implies your CSS probably controls visibility for .tab-content.active vs .tab-content — keep styles consistent (either via classes or inline styles) to avoid confusion.

// ==== Tab switching INSIDE each section ====
document.querySelectorAll('.tab-buttons').forEach(buttonGroup => {
  buttonGroup.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      const section = button.closest('.content-section');

      section.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      section.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

      button.classList.add('active');
      const tabId = button.dataset.tab;
      const targetPane = section.querySelector(`#${tabId}`);
      if (targetPane) targetPane.classList.add('active');

      if (tabId === 'percakapan-materi') {
        const visibleWeek = targetPane.querySelector('.week-content:not([style*="display: none"])') 
                         || targetPane.querySelector('#week1');
        if (visibleWeek) autoSelectFirstCardIn(visibleWeek);
      }
    });
  });
});

// ==== Section switcher: show only one big section at a time ====
function showSection(sectionId) {
  // Hide all sections: find every element with class "content-section"
  // and set its inline style.display to 'none' (so it's not visible).
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'active');

  // Find the section element whose id equals the sectionId parameter.
  // e.g. if sectionId === "home", this returns document.getElementById("home").
  const target = document.getElementById(sectionId);

  // If no element with that id exists, stop the function early to avoid errors.
  // (This is a guard clause.)
  if (!target) return;

  // Make the target section visible by setting its display to 'block'
  // (a block-level element). This overrides the earlier 'display: none'.
  target.style.display = 'block';

  // Find the first element inside the target that matches the selector
  // '.tab-buttons .tab-btn' — i.e., a .tab-btn that is inside an element
  // with class .tab-buttons. This will be the first matching .tab-btn node.
  const firstBtn = target.querySelector('.tab-buttons .tab-btn');

  // If we found a first tab button, initialize the tab state inside this section:
  if (firstBtn) {
    // Remove the 'active' class from every .tab-btn inside the target.
    // Note: 'b' is just the loop variable representing each .tab-btn element.
    target.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    // Remove the 'active' class from every .tab-content inside the target.
    // 'tc' is the loop variable representing each tab content pane.
    target.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

    // Add the 'active' class to the first button to mark it as selected.
    firstBtn.classList.add('active');

    // Read the value of the data-tab attribute on firstBtn.
    // For example, if the HTML is <button data-tab="pane1">, then tabId === "pane1".
    const tabId = firstBtn.dataset.tab;

    // Use that id to find the corresponding content pane inside the target.
    // The selector `#${tabId}` looks for an element with id equal to tabId.
    const firstPane = target.querySelector(`#${tabId}`);

    // If the pane exists, mark it as active (so it becomes visible via CSS).
    if (firstPane) firstPane.classList.add('active');
  }
}


// Select all <li> items inside elements with class ".dropdown-content"
// Syntax ini adalah syntax yang seharusnya dihapus, tetapi tidak dihapus karena waktu itu tertimbun dengan berbagai syntax lainnya, makanya lain kali kerjakan pelan-pelan seperti pengerjaan app.py
document.querySelectorAll('.dropdown-content li').forEach(item => {
  
  // Only add click behavior if the item DOES NOT have the "disabled" class
  if (!item.classList.contains('disabled')) {
    
    // When this dropdown item is clicked
    item.addEventListener('click', () => {
      
      // Remove "active" class from ALL dropdown items (so only one stays active)
      document.querySelectorAll('.dropdown-content li').forEach(li => 
        li.classList.remove('active')
      );

      // Add "active" class to the clicked item to highlight it
      item.classList.add('active');
    });
  }
});
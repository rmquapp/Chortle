/**
 * Created by Amanda on 3/23/2017.
 */
//https://www.w3schools.com/howto/howto_js_dropdown.asp

/* When the user clicks on the button,
 toggle between hiding and showing the dropdown content */
function showList() {
  document.getElementById("settings").classList.toggle("show");
}

function showAddChild() {
  document.getElementById("addChild").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {

    let dropdowns = document.getElementsByClassName("dropdown-content");
    let i;
    for (i = 0; i < dropdowns.length; i++) {
      let openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
};
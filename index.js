let unitBtn = document.getElementById("unitsButton");
let unitMenu = document.getElementById("unitsMenu");

function toggleUnitsDropdown(){

    const isExpanded = unitBtn.getAttribute('aria-expanded') === 'true';

    unitBtn.setAttribute('aria-expanded', !isExpanded);
    unitMenu.hidden = isExpanded;
}

unitBtn.addEventListener('click', toggleUnitsDropdown);

document.addEventListener('click', function(event){

    const isClickInside = unitBtn.contains(event.target) || unitMenu.contains(event.target);

    if (!isClickInside && unitMenu.hidden === false){
        unitMenu.hidden = true;
        unitBtn.setAttribute('aria-expanded', 'false');
    }

});

document.addEventListener('keydown', function(event){
    if(event.key === 'Escape' && unitMenu.hidden === false){
        unitMenu.hidden = true;
        unitBtn.setAttribute('aria-expanded', 'false');
        unitBtn.focus();
    }
});


















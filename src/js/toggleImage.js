/**
 * Toggles visibility to the output image
 * @param el [Object] Title element
 */
function toggleImage(el) {
  var img = document.querySelector("#div" + el.id.substr(3));

  img.style.display === "none"
    ? (img.style.display = "inherit")
    : (img.style.display = "none");
}

/**
 * Toggles visibility to the terminal output. This also removes the whitespace from the bottom of the group object.
 * @param el [Object] Title element
 */
function toggleTerminal(el) {
  var terminal = document.querySelector("#div" + el.id.substr(3));
  var parent = terminal.parentElement;

  if (terminal.style.display === "none") {
    terminal.style.display = "inherit";
    parent.style.marginBottom = "0px";
  } else {
    terminal.style.display = "none";
    parent.style.marginBottom = "-28px";
  }
}

function js_ShowHiddenPW(idElm) {
  var x = document.getElementById(idElm);
  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
}

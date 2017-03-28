/**
 * Created by amygelowitz on 2017-03-27.
 */

function addChild() {
  $.ajax({
    url: '/addChild',
    type: "POST",
    data: $("#addChildForm").serialize(),
    error: function (response) {
      console.log(response);
      $('#users').append(response);
    }
  });
}
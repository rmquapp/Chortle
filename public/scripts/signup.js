/**
 * Created by amygelowitz on 2017-04-05.
 */

// https://scotch.io/tutorials/submitting-ajax-forms-with-jquery#submitting-the-form-using-ajax-magicjs

$(document).ready(function() {

    // process the form
    $('#registration').submit(function (event) {

        // get the form data
        let formData = {
            'first': $('input[name=first]').val(),
            'last': $('input[name=last]').val(),
            'username': $('input[name=username]').val(),
            'email': $('input[name=email]').val(),
            'password': $('input[name=password]').val(),
            'pwdRepeat': $('input[name=pwdRepeat]').val(),
        };

        // process the form
        $.ajax({
            type: 'POST', // define the type of HTTP verb we want to use (POST for our form)
            url: '/signup', // the url where we want to POST
            data: formData, // our data object
            dataType: 'json', // what type of data do we expect back from the server
            encode: true
        })
        // using the done promise callback
            .done(function (data) {

                if ( !data.success) {
                    $('#warning').text(data.error);
                } else {
                    window.location = "/";
                }
            });

        // stop the form from submitting the normal way and refreshing the page
        event.preventDefault();
    });
});
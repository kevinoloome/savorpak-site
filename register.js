/* Savorpak sign-up form. Sends the details to the Savorpak backend and nothing else. */
(function () {
  'use strict';

  // Same endpoint logic as the original page: local backend when testing on this computer, live backend otherwise.
  // (To test against a local backend, also allow http://localhost:8000 in the page's connect-src.)
  var isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  var API_BASE_URL = isLocalhost ? 'http://localhost:8000' : 'https://backend.savorpak.com';
  var API_URL = API_BASE_URL + '/auth/register/';
  var PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.savorpak.water&pcampaignid=web_share';
  var REDIRECT_COUNTDOWN = 15; // seconds before sending the person to Google Play

  var FIELDS = ['firstName', 'lastName', 'email', 'estate', 'phoneNumber', 'password', 'confirmPassword'];
  var FIELD_MAP = {
    first_name: 'firstName',
    last_name: 'lastName',
    email: 'email',
    estate: 'estate',
    phone_number: 'phoneNumber',
    password: 'password',
    confirm_password: 'confirmPassword'
  };

  function byId(id) { return document.getElementById(id); }

  var form = byId('registrationForm');
  if (!form) return;

  var formCard = byId('formCard');
  var successCard = byId('successCard');
  var alertBox = byId('formAlert');
  var submitBtn = byId('submitBtn');
  var referralBadge = byId('referralBadge');
  var referralInput = byId('referralLink');

  /* Referral link from the address, e.g. register?ref_link=%2B254712345678 */
  var refLink = new URLSearchParams(window.location.search).get('ref_link');
  if (refLink) {
    // A "+" in a web address is read as a space, so put it back for phone-number referral codes.
    refLink = refLink.replace(/^ /, '+');
  }
  if (refLink) {
    referralBadge.hidden = false;
    referralInput.value = refLink;
  }

  /* Show / hide password */
  Array.prototype.forEach.call(document.querySelectorAll('.reg-toggle'), function (btn) {
    btn.addEventListener('click', function () {
      var input = byId(btn.getAttribute('data-target'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', show ? 'true' : 'false');
    });
  });

  /* Errors */
  function showFieldError(id, message) {
    var input = byId(id);
    var error = byId(id + 'Error');
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    error.textContent = message;
    error.hidden = false;
  }

  function clearFieldError(id) {
    var input = byId(id);
    var error = byId(id + 'Error');
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    error.textContent = '';
    error.hidden = true;
  }

  function clearAllErrors() {
    FIELDS.concat(['termsAccepted']).forEach(clearFieldError);
    alertBox.hidden = true;
    alertBox.textContent = '';
  }

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.hidden = false;
  }

  FIELDS.forEach(function (id) {
    byId(id).addEventListener('input', function () {
      clearFieldError(id);
      alertBox.hidden = true;
    });
  });
  byId('termsAccepted').addEventListener('change', function () {
    clearFieldError('termsAccepted');
    alertBox.hidden = true;
  });

  /* Kenyan phone format: 07.. / 01.. / 7.. / 1.. become +254... */
  function formatPhoneNumber(phone) {
    phone = phone.trim();
    if (phone.indexOf('+254') === 0) return phone;
    if (phone.charAt(0) === '0') return '+254' + phone.substring(1);
    if (phone.charAt(0) === '7' || phone.charAt(0) === '1') return '+254' + phone;
    return phone;
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Creating account...' : 'Create Account';
  }

  function showSuccess() {
    formCard.hidden = true;
    successCard.hidden = false;
    window.scrollTo(0, 0);
    byId('successTitle').focus();

    var left = REDIRECT_COUNTDOWN;
    var counter = byId('countdown');
    counter.textContent = left;
    var timer = setInterval(function () {
      left -= 1;
      counter.textContent = left;
      if (left <= 0) {
        clearInterval(timer);
        window.location.href = PLAY_STORE_URL;
      }
    }, 1000);
  }

  function showServerErrors(body) {
    if (body && body.details && typeof body.details === 'object') {
      Object.keys(body.details).forEach(function (field) {
        var messages = body.details[field];
        if (Array.isArray(messages) && messages.length > 0) {
          var id = FIELD_MAP[field] || field;
          if (byId(id) && byId(id + 'Error')) showFieldError(id, String(messages[0]));
        }
      });
      showAlert('Please check your information and try again.');
    } else if (body && typeof body.message === 'string' && body.message) {
      showAlert(body.message);
    } else {
      showAlert('Registration failed. Please try again.');
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearAllErrors();

    var firstName = byId('firstName').value.trim();
    var lastName = byId('lastName').value.trim();
    var email = byId('email').value.trim();
    var estate = byId('estate').value.trim();
    var phoneNumber = formatPhoneNumber(byId('phoneNumber').value);
    var password = byId('password').value;
    var confirmPassword = byId('confirmPassword').value;
    var termsAccepted = byId('termsAccepted').checked;
    var referralLink = referralInput.value;

    var firstInvalid = null;
    function invalid(id, message) {
      showFieldError(id, message);
      if (!firstInvalid) firstInvalid = id;
    }

    if (!firstName) invalid('firstName', 'First name is required');
    if (!lastName) invalid('lastName', 'Last name is required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid('email', 'Please enter a valid email address');
    if (!estate) invalid('estate', 'Estate is required');
    if (!byId('phoneNumber').value.trim()) invalid('phoneNumber', 'Phone number is required');
    if (password.length < 8) invalid('password', 'Password must be at least 8 characters long');
    if (password !== confirmPassword) invalid('confirmPassword', 'Passwords do not match');
    if (!termsAccepted) invalid('termsAccepted', 'Please accept the Terms and Conditions to proceed');

    if (firstInvalid) {
      byId(firstInvalid).focus();
      return;
    }

    setBusy(true);

    var data = {
      email: email,
      estate: estate,
      phone_number: phoneNumber,
      password: password,
      confirm_password: confirmPassword,
      first_name: firstName,
      last_name: lastName
    };
    if (referralLink) data.referral_link = referralLink;

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          return { ok: response.ok, body: body };
        });
      })
      .then(function (result) {
        if (result.ok) {
          form.reset();
          showSuccess();
        } else {
          showServerErrors(result.body);
        }
      })
      .catch(function () {
        showAlert('An error occurred. Please check your internet connection and try again.');
      })
      .then(function () {
        setBusy(false);
      });
  });
})();

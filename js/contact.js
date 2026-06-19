// Contact form handler for HARSHA METAL_FRAM_WORKS

document.addEventListener("DOMContentLoaded", () => {
  prefillContactForm();
  setupContactFormSubmission();
});

// Auto-fill values if customer is already logged in
function prefillContactForm() {
  const session = localStorage.getItem("user_session");
  if (session) {
    try {
      const user = JSON.parse(session);
      document.getElementById("contact-name").value = user.name || "";
      document.getElementById("contact-email").value = user.email || "";
      if (user.phone) {
        document.getElementById("contact-phone").value = user.phone;
      }
    } catch(e){}
  }
}

function setupContactFormSubmission() {
  const form = document.getElementById("contact-form");
  const submitBtn = document.getElementById("contact-submit-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const phone = document.getElementById("contact-phone").value.trim();
    const message = document.getElementById("contact-msg").value.trim();

    submitBtn.disabled = true;
    submitBtn.classList.add("loading");

    const messageData = {
      name: name,
      email: email,
      phone: phone,
      message: message
    };

    try {
      await dbMock.addContactMessage(messageData);
      window.showToast("Message sent successfully! We will contact you soon.", "success");
      
      // Reset only message body, keep credentials
      document.getElementById("contact-msg").value = "";
    } catch (err) {
      console.error(err);
      window.showToast("Failed to submit inquiry. Please try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
    }
  });
}

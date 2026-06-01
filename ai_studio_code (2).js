async function submitOrder(e) {
  e.preventDefault();

  const nameVal = document.getElementById('cust-name').value.trim();
  const phoneVal = document.getElementById('cust-phone').value.trim();
  const addressVal = document.getElementById('cust-address').value.trim();
  const instructionsVal = document.getElementById('cust-instructions').value.trim();

  if (!nameVal || !phoneVal || !addressVal || cart.length === 0) return;

  // Change button state to visual loading
  const orderBtn = document.getElementById('place-order-btn');
  orderBtn.disabled = true;
  orderBtn.innerText = "Processing...";

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: {
          name: nameVal,
          phone: phoneVal,
          address: addressVal,
          instructions: instructionsVal
        },
        items: cart
      })
    });

    const data = await response.json();

    if (response.ok && data.url) {
      // Clean cart and form elements local state before redirect
      cart = [];
      updateCartUI();
      document.getElementById('checkout-form').reset();
      
      // Redirect user to secure Stripe Checkout page
      window.location.href = data.url;
    } else {
      alert(data.error || "A payment mapping error occurred. Please try again.");
      orderBtn.disabled = false;
      orderBtn.innerText = "Place Your Delivery Order";
    }
  } catch (error) {
    console.error("Network communication failure:", error);
    alert("Connection error. Could not contact the secure checkout service.");
    orderBtn.disabled = false;
    orderBtn.innerText = "Place Your Delivery Order";
  }
}
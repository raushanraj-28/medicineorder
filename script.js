window.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('register.html')) {
        createDemoAccounts();
    }
        const fileInput = document.getElementById('prescription');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
            if (document.getElementById('fileName')) {
                document.getElementById('fileName').textContent = fileName;
            }
        });
    }
});


function register() {
    let name = document.getElementById('regName').value.trim();
    let email = document.getElementById('regEmail').value.trim();
    let password = document.getElementById('regPassword').value;
    let phone = document.getElementById('regPhone').value.trim();
    let role = document.getElementById('regRole').value;

    if (!name || !email || !password || !phone) {
        alert("Please fill in all fields!");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long!");
        return;
    }

    if (!isValidEmail(email)) {
        alert("Please enter a valid email address!");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.find(u => u.email === email)) {
        alert("An account with this email already exists!");
        return;
    }

    let userData = { 
        id: Date.now(),
        name, 
        email, 
        password,
        phone,
        role,
        registeredAt: new Date().toLocaleString()
    };
        if (role === 'pharmacy') {
        let street = document.getElementById('regStreet').value.trim();
        let city = document.getElementById('regCity').value.trim();
        let fullAddress = document.getElementById('regFullAddress').value.trim();
        
        if (!street || !city || !fullAddress) {
            alert("Please fill in all pharmacy address fields!");
            return;
        }
        
        userData.address = {
            street,
            city,
            fullAddress
        };
    }
    
    users.push(userData);
    localStorage.setItem("users", JSON.stringify(users));

    alert(`Registration Successful! Welcome ${name}. Please login.`);
    window.location.href = "login.html";
}


function login() {
    let email = document.getElementById('loginEmail').value.trim();
    let password = document.getElementById('loginPassword').value;
    let role = document.getElementById('loginRole').value;

    if (!email || !password) {
        alert("Please enter both email and password!");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];

    let validUser = users.find(u =>
        u.email === email &&
        u.password === password &&
        u.role === role
    );

    if (!validUser) {
        alert("Invalid email, password, or role selected!");
        return;
    }

    localStorage.setItem("currentUser", JSON.stringify(validUser));
    
    let loginHistory = JSON.parse(localStorage.getItem("loginHistory")) || [];
    loginHistory.push({
        email: email,
        role: role,
        timestamp: new Date().toLocaleString()
    });
    localStorage.setItem("loginHistory", JSON.stringify(loginHistory));

    if (role === "user") {
        window.location.href = "index.html";
    } else {
        window.location.href = "pharmacy.html";
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


function checkUserAccess() {
    let user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user || user.role !== "user") {
        window.location.href = "login.html";
    } else {
        if (document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.name;
        }
    }
}

function checkPharmacyAccess() {
    let user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user || user.role !== "pharmacy") {
        window.location.href = "login.html";
    } else {
        if (document.getElementById('pharmacyName')) {
            document.getElementById('pharmacyName').textContent = user.name;
        }
    }
}

function displayPharmacyInfo() {
    let user = JSON.parse(localStorage.getItem("currentUser"));
    let div = document.getElementById('pharmacyAddressDisplay');
    
    if (div && user && user.address) {
        div.innerHTML = `
            <strong><i class="fas fa-map-marker-alt"></i> Your Pharmacy Address:</strong><br>
            ${user.address.fullAddress}<br>
            <small>Phone: ${user.phone || 'Not provided'}</small>
        `;
    }
}

function placeOrder() {
    let medicines = document.getElementById('medicines').value.trim();
    let prescriptionFile = document.getElementById('prescription').files[0];
    
    let orderTypeInputs = document.getElementsByName('orderType');
    let orderType = 'normal'; // default
    
    for (let i = 0; i < orderTypeInputs.length; i++) {
        if (orderTypeInputs[i].checked) {
            orderType = orderTypeInputs[i].value;
            break;
        }
    }
    
    let user = JSON.parse(localStorage.getItem("currentUser"));

    if (!medicines && !prescriptionFile) {
        alert("Please enter medicine names or upload a prescription!");
        return;
    }

    if (prescriptionFile) {
        document.getElementById('fileName').textContent = prescriptionFile.name;
    }

    if (prescriptionFile) {
        let reader = new FileReader();
        reader.onload = function(e) {
            saveOrder(medicines, orderType, user, e.target.result, prescriptionFile.name);
        };
        reader.readAsDataURL(prescriptionFile);
    } else {
        saveOrder(medicines, orderType, user, null, null);
    }
}

function saveOrder(medicines, orderType, user, prescriptionData, fileName) {
    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    let newOrder = {
        id: Date.now(),
        userEmail: user.email,
        userName: user.name,
        userPhone: user.phone,
        medicines: medicines || "Prescription Uploaded",
        prescription: prescriptionData,
        prescriptionName: fileName,
        orderType,
        extraCharge: orderType === "emergency" ? 100 : 0,
        status: "Pending",
        assignedTo: null, 
        assignedPharmacyName: null,
        assignedPharmacyAddress: null,
        assignedPharmacyPhone: null,
        timestamp: new Date().toLocaleString(),
        visibleToAll: true 
    };

    orders.push(newOrder);
    localStorage.setItem("orders", JSON.stringify(orders));

    alert("Order Placed Successfully! All nearby pharmacies can now see your order. First pharmacy to accept will prepare it.");
    document.getElementById('medicines').value = '';
    document.getElementById('prescription').value = '';
    document.getElementById('fileName').textContent = 'No file chosen';
    loadUserOrders();
}

function loadUserOrders() {
    let user = JSON.parse(localStorage.getItem("currentUser"));
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    let div = document.getElementById("userOrders");
    if (!div) return;

    div.innerHTML = "";

    let userOrders = orders.filter(o => o.userEmail === user.email);
    
    if (userOrders.length === 0) {
        div.innerHTML = '<p class="no-orders">No orders placed yet.</p>';
        return;
    }

    userOrders.reverse().forEach(order => {
        let statusClass = getStatusClass(order.status);
        let statusText = getStatusText(order.status);
        let priorityClass = order.orderType === 'emergency' ? 'priority-emergency' : 'priority-normal';
        let priorityText = order.orderType === 'emergency' ? '🚨 EMERGENCY' : '📦 NORMAL';
        
        let pharmacyInfo = '';
        let statusMessage = '';
        
        if (order.assignedTo) {
            pharmacyInfo = `
                <div class="order-pharmacy-info">
                    <h4><i class="fas fa-clinic-medical"></i> Pharmacy Information:</h4>
                    <p><strong>Pharmacy:</strong> ${order.assignedPharmacyName}</p>
                    <p><strong>Address:</strong> ${order.assignedPharmacyAddress}</p>
                    <p><strong>Phone:</strong> ${order.assignedPharmacyPhone}</p>
                    ${order.assignedPharmacyAddress ? `
                        <a href="https://maps.google.com/?q=${encodeURIComponent(order.assignedPharmacyAddress)}" 
                           target="_blank" class="btn-map">
                            <i class="fas fa-map"></i> Get Directions
                        </a>
                    ` : ''}
                </div>
            `;
            statusMessage = `<span style="color: #06d6a0; font-size: 14px;"><i class="fas fa-check-circle"></i> Accepted by ${order.assignedPharmacyName}</span>`;
        } else {
            statusMessage = `<span style="color: #ffc107; font-size: 14px;"><i class="fas fa-clock"></i> Waiting for pharmacy to accept</span>`;
        }
        
        div.innerHTML += `
            <div class="order-card ${order.status.toLowerCase().replace(' for pickup', '-ready').replace(/ /g, '-')} ${order.orderType}">
                <div class="order-header">
                    <div>
                        <span class="order-id">Order #${order.id}</span>
                        <span class="order-priority ${priorityClass}">${priorityText}</span>
                        ${order.assignedTo ? '<span class="accepted-badge">Accepted</span>' : ''}
                    </div>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                <div class="order-details">
                    ${statusMessage}
                    <p><strong>Medicines:</strong> ${order.medicines}</p>
                    <p><strong>Priority:</strong> ${order.orderType === 'emergency' ? 'Emergency (Ready in 10-15 mins)' : 'Normal (Ready in 30-60 mins)'}</p>
                    <p><strong>Priority Fee:</strong> ₹${order.extraCharge}</p>
                    <p><strong>Placed At:</strong> ${order.timestamp}</p>
                    ${order.prescriptionName ? `<p><strong>Prescription:</strong> ${order.prescriptionName}</p>` : ''}
                </div>
                ${pharmacyInfo}
                ${order.status === "Ready for Pickup" ? `
                <div class="pickup-instructions">
                    <i class="fas fa-info-circle"></i>
                    Your order is ready! Please visit ${order.assignedPharmacyName || 'the pharmacy'} to collect.
                </div>
                ` : ''}
                ${!order.assignedTo && order.status === "Pending" ? `
                <div class="pickup-instructions" style="background: #fff3cd; border-color: #ffc107;">
                    <i class="fas fa-clock"></i>
                    Your order is visible to all pharmacies. First pharmacy to accept will prepare it.
                </div>
                ` : ''}
            </div>
        `;
    });
}

function loadPharmacyOrders() {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    let div = document.getElementById("pharmacyOrders");
    let availableCount = 0, myOrdersCount = 0, readyCount = 0;
    
    if (div) {
        div.innerHTML = "";

        if (orders.length === 0) {
            div.innerHTML = '<p class="no-orders">No orders available at the moment.</p>';
            return;
        }

       
        let pharmacyOrders = orders.filter(order => 
            !order.assignedTo || 
            order.assignedTo === currentUser.id 
        );

        if (pharmacyOrders.length === 0) {
            div.innerHTML = '<p class="no-orders">No orders available at the moment.</p>';
            return;
        }

        pharmacyOrders.reverse().forEach(order => {
            let statusClass = getStatusClass(order.status);
            let statusText = getStatusText(order.status);
            let priorityClass = order.orderType === 'emergency' ? 'priority-emergency' : 'priority-normal';
            let priorityText = order.orderType === 'emergency' ? '🚨 EMERGENCY' : '📦 NORMAL';
            
            if (!order.assignedTo && order.status === "Pending") availableCount++;
            if (order.assignedTo === currentUser.id) myOrdersCount++;
            if (order.status === "Ready for Pickup" && order.assignedTo === currentUser.id) readyCount++;

            let prescriptionView = "";
            if (order.prescription) {
                prescriptionView = `
                    <button class="btn-action btn-view" onclick="viewPrescription('${order.prescription}')">
                        <i class="fas fa-file-medical"></i> View Prescription
                    </button>
                `;
            }

            let acceptButton = '';
            if (!order.assignedTo && order.status === "Pending") {
                acceptButton = `
                    <button class="btn-action btn-accept" onclick="acceptOrder(${order.id})">
                        <i class="fas fa-handshake"></i> Accept This Order
                    </button>
                `;
            }

            let orderStatusInfo = '';
            if (order.assignedTo === currentUser.id) {
                orderStatusInfo = '<span class="accepted-badge">Accepted by You</span>';
            } else if (!order.assignedTo) {
                orderStatusInfo = '<span style="color: #ffc107; font-size: 12px;"><i class="fas fa-eye"></i> Visible to All Pharmacies</span>';
            } else {
                orderStatusInfo = '<span style="color: #dc3545; font-size: 12px;"><i class="fas fa-lock"></i> Accepted by Another Pharmacy</span>';
            }

            div.innerHTML += `
                <div class="order-card ${order.status.toLowerCase().replace(' for pickup', '-ready').replace(/ /g, '-')} ${order.orderType}">
                    <div class="order-header">
                        <div>
                            <span class="order-id">Order #${order.id}</span>
                            <span class="order-priority ${priorityClass}">${priorityText}</span>
                            ${orderStatusInfo}
                        </div>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-details">
                        <p><strong>Customer:</strong> ${order.userName}</p>
                        <p><strong>Customer Phone:</strong> ${order.userPhone || 'Not provided'}</p>
                        <p><strong>Medicines:</strong> ${order.medicines}</p>
                        <p><strong>Priority:</strong> ${order.orderType === 'emergency' ? '🚨 EMERGENCY (Prepare in 10-15 mins)' : '📦 NORMAL (Prepare in 30-60 mins)'}</p>
                        <p><strong>Priority Fee:</strong> ₹${order.extraCharge}</p>
                        <p><strong>Placed At:</strong> ${order.timestamp}</p>
                        ${order.prescriptionName ? `<p><strong>Prescription:</strong> ${order.prescriptionName}</p>` : ''}
                        ${order.assignedTo === currentUser.id ? `
                            <p><strong>Your Commission:</strong> ₹${order.orderType === 'emergency' ? '50' : '30'} (from priority fee)</p>
                        ` : ''}
                    </div>
                    <div class="order-actions">
                        ${prescriptionView}
                        ${acceptButton}
                        ${order.assignedTo === currentUser.id && order.status === "Pending" ? `
                            <button class="btn-action btn-ready" onclick="updateStatus(${order.id}, 'Ready for Pickup')">
                                <i class="fas fa-check"></i> Mark Ready for Pickup
                            </button>
                            <button class="btn-action btn-reject" onclick="rejectOrder(${order.id})">
                                <i class="fas fa-times"></i> Cancel Acceptance
                            </button>
                        ` : ''}
                        ${order.assignedTo === currentUser.id && order.status === "Ready for Pickup" ? `
                            <button class="btn-action btn-reject" onclick="updateStatus(${order.id}, 'Pending')">
                                <i class="fas fa-undo"></i> Revert to Pending
                            </button>
                        ` : ''}
                        ${order.assignedTo === currentUser.id && order.status === "Rejected" ? `
                            <button class="btn-action btn-ready" onclick="updateStatus(${order.id}, 'Pending')">
                                <i class="fas fa-undo"></i> Restore Order
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    }

    if (document.getElementById('availableCount')) {
        document.getElementById('availableCount').textContent = availableCount;
    }
    if (document.getElementById('myOrdersCount')) {
        document.getElementById('myOrdersCount').textContent = myOrdersCount;
    }
    if (document.getElementById('readyCount')) {
        document.getElementById('readyCount').textContent = readyCount;
    }
}

function acceptOrder(orderId) {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    
    let order = orders.find(o => o.id === orderId);
    if (order && order.assignedTo && order.assignedTo !== currentUser.id) {
        alert("This order has already been accepted by another pharmacy!");
        loadPharmacyOrders();
        return;
    }
    
    orders = orders.map(order => {
        if (order.id === orderId) {
            return {
                ...order,
                assignedTo: currentUser.id,
                assignedPharmacyName: currentUser.name,
                assignedPharmacyAddress: currentUser.address?.fullAddress || "Address not available",
                assignedPharmacyPhone: currentUser.phone || "Not available",
                acceptedAt: new Date().toLocaleString(),
                status: "Pending",
                visibleToAll: false 
            };
        }
        return order;
    });

    localStorage.setItem("orders", JSON.stringify(orders));
    
    alert(`Order accepted successfully! You now have exclusive rights to prepare this order. Other pharmacies can no longer see it.\n\nCustomer Information:\nName: ${order.userName}\nPhone: ${order.userPhone || 'Not provided'}\nMedicines: ${order.medicines}`);
    loadPharmacyOrders();
}

function rejectOrder(orderId) {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    
    if (!confirm("Are you sure you want to cancel this order acceptance? The order will become available for other pharmacies.")) {
        return;
    }
    
    orders = orders.map(order => {
        if (order.id === orderId && order.assignedTo === currentUser.id) {
            return {
                ...order,
                assignedTo: null,
                assignedPharmacyName: null,
                assignedPharmacyAddress: null,
                assignedPharmacyPhone: null,
                status: "Pending",
                visibleToAll: true,
                rejectedAt: new Date().toLocaleString()
            };
        }
        return order;
    });

    localStorage.setItem("orders", JSON.stringify(orders));
    
    alert("Order acceptance cancelled! It is now available for other pharmacies.");
    loadPharmacyOrders();
}

function updateStatus(id, status) {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    orders = orders.map(order => {
        if (order.id === id && order.assignedTo === currentUser.id) {
            return {
                ...order,
                status: status,
                updatedAt: new Date().toLocaleString()
            };
        }
        return order;
    });

    localStorage.setItem("orders", JSON.stringify(orders));
    loadPharmacyOrders();
    
    if (typeof loadUserOrders === 'function') {
        setTimeout(loadUserOrders, 100);
    }
}

function getStatusClass(status) {
    if (status === "Pending") return "status-pending";
    if (status === "Ready for Pickup") return "status-ready";
    if (status === "Rejected") return "status-rejected";
    return "";
}

function getStatusText(status) {
    if (status === "Ready for Pickup") return "Ready";
    return status;
}

function viewPrescription(prescriptionData) {
    const modal = document.createElement('div');
    modal.className = 'prescription-modal';
    modal.innerHTML = `
        <div class="prescription-content">
            <button class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</button>
            <h3>Prescription View</h3>
            <img src="${prescriptionData}" alt="Prescription" />
            <p style="margin-top: 10px; font-size: 14px; color: #666;">Close this window when done viewing.</p>
        </div>
    `;
    document.body.appendChild(modal);
}

function filterOrders(filter) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const orders = document.querySelectorAll('.order-card');
    orders.forEach(order => {
        if (filter === 'all') {
            order.style.display = 'block';
        } else if (filter === 'available') {
            const isPending = order.classList.contains('pending');
            const hasAcceptedBadge = order.querySelector('.accepted-badge');
            order.style.display = (isPending && !hasAcceptedBadge) ? 'block' : 'none';
        } else if (filter === 'myorders') {
            const hasAcceptedBadge = order.querySelector('.accepted-badge');
            order.style.display = hasAcceptedBadge ? 'block' : 'none';
        } else if (filter === 'emergency') {
            const isEmergency = order.classList.contains('emergency');
            order.style.display = isEmergency ? 'block' : 'none';
        } else {
            const orderClass = filter === 'ready' ? 'ready-for-pickup' : filter;
            const hasClass = order.classList.contains(orderClass);
            order.style.display = hasClass ? 'block' : 'none';
        }
    });
}

function clearAllData() {
    if (confirm("⚠️ WARNING: This will delete ALL data including users, orders, and login info. Are you sure?")) {
        localStorage.clear();
        alert("All data has been cleared! Redirecting to login page.");
        window.location.href = "login.html";
    }
}

function logout() {
    let user = JSON.parse(localStorage.getItem("currentUser"));
    if (user) {
        alert(`Goodbye, ${user.name}! You have been logged out.`);
    }
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}

setInterval(() => {
    if (window.location.pathname.includes('pharmacy.html')) {
        loadPharmacyOrders();
    }
    if (window.location.pathname.includes('index.html')) {
        loadUserOrders();
    }
}, 3000); 
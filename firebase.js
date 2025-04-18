import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFJm4xyAXFPkCLuJK4Q7U5CQi5vyur5ZA",
  authDomain: "buonomo-s-menu.firebaseapp.com",
  projectId: "buonomo-s-menu",
  storageBucket: "buonomo-s-menu.firebasestorage.app",
  messagingSenderId: "288056046537",
  appId: "1:288056046537:web:c28823516d7ddc4951ae18"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const drinkList = document.getElementById("drinkList");
const loginForm = document.getElementById("loginForm");
const addDrinkForm = document.getElementById("addDrinkForm");
const ordersList = document.getElementById("ordersList");
const ordersSection = document.getElementById("ordersSection");
let isAdmin = false;

function renderDrinks(drinks) {
  drinkList.innerHTML = drinks.map(drink => `
    <div class="col-md-6 mb-4">
      <div class="card p-3 position-relative" data-id="${drink.id}">
        ${isAdmin ? `<i class="bi bi-trash delete-icon"></i>` : ''}
        <h3>${drink.name}</h3>
        <ul class="list-unstyled">
          ${drink.ingredients.map(i => `<li>${i}</li>`).join('')}
        </ul>
        ${!isAdmin ? `<button class="btn btn-primary order-btn" onclick="orderDrink('${drink.id}', '${drink.name}')">Ordina</button>` : ''}
      </div>
    </div>
  `).join("");

  if (isAdmin) {
    document.querySelectorAll(".delete-icon").forEach(icon => {
      icon.addEventListener("click", async (e) => {
        const card = e.target.closest(".card");
        const id = card.getAttribute("data-id");
        if (confirm("Sei sicuro di voler eliminare questo drink?")) {
          try {
            await deleteDoc(doc(db, "drinks", id));
            fetchDrinks();
          } catch (e) {
            alert("Errore durante l'eliminazione: " + e.message);
          }
        }
      });
    });
  }
}

async function fetchDrinks() {
  const querySnapshot = await getDocs(collection(db, "drinks"));
  const drinks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderDrinks(drinks);
}

async function fetchOrders() {
  if (!isAdmin) return;
  
  try {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    ordersList.innerHTML = orders.length ? orders.map(order => `
      <div class="card mb-3 order-item" data-id="${order.id}">
        <div class="card-body">
          <h5 class="card-title">${order.drinkName}</h5>
          <p class="card-text">
            <span class="badge ${order.status === 'In Attesa' ? 'bg-warning' : 'bg-success'}">${order.status}</span>
            <small class="text-muted ms-2">${new Date(order.timestamp.seconds * 1000).toLocaleString()}</small>
          </p>
          <div class="d-flex justify-content-end">
            ${order.status === 'In Attesa' ? 
              `<button class="btn btn-success btn-sm me-2" onclick="completeOrder('${order.id}')">Completato</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="deleteOrder('${order.id}')">Elimina</button>
          </div>
        </div>
      </div>
    `).join('') : '<p class="text-center">Nessun ordine disponibile</p>';
  } catch (e) {
    console.error("Errore nel recupero degli ordini:", e);
    ordersList.innerHTML = '<p class="text-center text-danger">Errore nel caricamento degli ordini</p>';
  }
}

window.login = async function () {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const email = `${username}@buonomo.fake`;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert("Login fallito: " + e.message);
  }
};

window.addDrink = async function () {
  const name = document.getElementById("drinkName").value;
  const ingredients = document.getElementById("drinkIngredients").value.split("\n").map(s => s.trim()).filter(Boolean);
  if (!name || ingredients.length === 0) return;

  try {
    await addDoc(collection(db, "drinks"), { name, ingredients });
    fetchDrinks();
    document.getElementById("drinkName").value = "";
    document.getElementById("drinkIngredients").value = "";
  } catch (e) {
    alert("Errore: " + e.message);
  }
};

window.deleteDrink = async function (id) {
  if (!confirm("Sei sicuro di voler eliminare questo drink?")) return;
  try {
    await deleteDoc(doc(db, "drinks", id));
    fetchDrinks();
  } catch (e) {
    alert("Errore: " + e.message);
  }
};

window.orderDrink = async function(drinkId, drinkName) {
  if (confirm(`Vuoi ordinare un "${drinkName}"?`)) {
    try {
      await addDoc(collection(db, "orders"), {
        drinkId,
        drinkName,
        status: "In Attesa",
        timestamp: Timestamp.now()
      });
      
      alert("Ordine effettuato con successo!");
    } catch (e) {
      alert("Errore durante l'ordine: " + e.message);
    }
  }
};

window.completeOrder = async function(orderId) {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status: "Completato"
    });
    fetchOrders();
  } catch (e) {
    alert("Errore durante l'aggiornamento dell'ordine: " + e.message);
  }
};

window.deleteOrder = async function(orderId) {
  if (confirm("Sei sicuro di voler eliminare questo ordine?")) {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      fetchOrders();
    } catch (e) {
      alert("Errore durante l'eliminazione dell'ordine: " + e.message);
    }
  }
};

window.clearAllOrders = async function() {
  if (!confirm("Sei sicuro di voler eliminare tutti gli ordini?")) return;
  
  try {
    const querySnapshot = await getDocs(collection(db, "orders"));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    fetchOrders();
    alert("Tutti gli ordini sono stati eliminati con successo!");
  } catch (e) {
    alert("Errore durante l'eliminazione degli ordini: " + e.message);
  }
};

onAuthStateChanged(auth, (user) => {
  if (user && user.email === "drgslayer@buonomo.fake") {
    loginForm.style.display = "none";
    addDrinkForm.style.display = "block";
    ordersSection.style.display = "block";
    isAdmin = true;
    fetchOrders();
  } else {
    loginForm.style.display = "block";
    addDrinkForm.style.display = "none";
    ordersSection.style.display = "none";
    isAdmin = false;
  }
  fetchDrinks();
});

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  fetchDrinks();
});
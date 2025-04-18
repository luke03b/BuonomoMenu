import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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

onAuthStateChanged(auth, (user) => {
  if (user && user.email === "drgslayer@buonomo.fake") {
    loginForm.style.display = "none";
    addDrinkForm.style.display = "block";
    isAdmin = true;
  }
  fetchDrinks();
});

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAg0r3z00cIc2bNNV6LaxBqzA5VFbObN68",
    authDomain: "markly-88bc6.firebaseapp.com",
    projectId: "markly-88bc6",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function listUsers() {
    try {
        await signInWithEmailAndPassword(auth, "akansha@gmail.com", "akansha");
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        console.log(`Found ${snapshot.size} total users.`);
        
        for (const d of snapshot.docs) {
            const data = d.data();
            console.log(`ID: ${d.id}, Name: ${data.name}, Email: ${data.email}, Role: ${data.role}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();

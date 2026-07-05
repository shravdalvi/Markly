import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAqaTXcugEGGJssJIdtBVplK4gYBmpLBI8",
    authDomain: "markly-ac5e8.firebaseapp.com",
    projectId: "markly-ac5e8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TARGET_NAMES = ["john", "student-01", "krrish", "karan"];

async function removeUsers() {
    try {
        console.log("Fetching users without auth...");
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        console.log(`Found ${snapshot.size} total users.`);
        
        let deletedCount = 0;
        
        for (const d of snapshot.docs) {
            const userData = d.data();
            const name = (userData.name || "").toLowerCase();
            
            // Check if any target string is in the user's name
            const shouldDelete = TARGET_NAMES.some(target => name.includes(target));
            
            if (shouldDelete) {
                console.log(`Deleting user: ${userData.name} (ID: ${d.id})`);
                await deleteDoc(doc(db, "users", d.id));
                deletedCount++;
            }
        }
        
        console.log(`Deleted ${deletedCount} users. Done. Exiting process.`);
        process.exit(0);
    } catch (err) {
        console.error("Error occurred:", err);
        process.exit(1);
    }
}

removeUsers();

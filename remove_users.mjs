import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAg0r3z00cIc2bNNV6LaxBqzA5VFbObN68",
    authDomain: "markly-88bc6.firebaseapp.com",
    projectId: "markly-88bc6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function removeUsers() {
    console.log("Fetching users...");
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    console.log(`Found ${snapshot.size} total users.`);
    
    let deletedCount = 0;
    const targets = ["joh", "krrish", "karan"];
    
    for (const d of snapshot.docs) {
        const userData = d.data();
        const name = userData.name ? userData.name.toLowerCase() : "";
        
        // Check if any target string is in the user's name
        const shouldDelete = targets.some(target => name.includes(target));
        
        if (shouldDelete) {
            console.log(`Deleting user: ${userData.name} (ID: ${d.id})`);
            await deleteDoc(doc(db, "users", d.id));
            deletedCount++;
        }
    }
    
    console.log(`Deleted ${deletedCount} users. Done. Exiting process.`);
    process.exit(0);
}

removeUsers();

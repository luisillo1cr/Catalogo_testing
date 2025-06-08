// js/updateImageURL.js
import { getDownloadURL, ref } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";
import { doc, updateDoc }       from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { storage, db }          from "./firebase.js";

(async()=>{
  const updates = [
    { productId: "xPQ8RvZP52TJmYQPWOsU", path: "products/perfume_prueba.png" },
    // puedes agregar más si quieres
  ];
  for (const { productId, path } of updates) {
    const url = await getDownloadURL(ref(storage, path));
    await updateDoc(doc(db, "products", productId), { imageURL: url });
    console.log(`Actualizado ${productId}:`, url);
  }
})();

// export.js
const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
    credential: admin.credential.cert(require('/Users/Mami/programas/CondoTrack/condotrack-cdee4-firebase-adminsdk-fbsvc-0686096284.json'))
  });

const db = admin.firestore();

async function exportAll() {
  const collections = await db.listCollections();
  const data = {};

  for (const col of collections) {
    const snapshot = await col.get();
    data[col.id] = {};
    snapshot.forEach(doc => {
      data[col.id][doc.id] = doc.data();
    });
    console.log(`Exportado: ${col.id} (${snapshot.size} docs)`);
  }

  fs.writeFileSync('condotrack-export.json', JSON.stringify(data, null, 2));
  console.log('Concluído!');
}

exportAll();    
const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Add helper functions at the top after imports
const helperFunctions = `
async function uploadToSupabaseStorage(base64Data, folder, prefix) {
  const matches = base64Data.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 format');
  }

  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const extension = mimeType.split('/')[1] === 'svg+xml' ? 'svg' : (mimeType.split('/')[1] || 'jpg');
  const fileName = \`\${prefix}_\${Date.now()}.\${extension}\`;
  const filePath = \`\${folder}/\${fileName}\`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(\`Gagal upload ke Supabase: \${error.message}. Pastikan bucket 'uploads' sudah dibuat dan public.\`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

async function deleteFromSupabaseStorage(fileUrl) {
  try {
    if (!fileUrl) return;
    const urlParts = fileUrl.split('/storage/v1/object/public/uploads/');
    if (urlParts.length === 2) {
      const filePath = urlParts[1];
      await supabase.storage.from('uploads').remove([filePath]);
    }
  } catch (error) {
    console.error('Failed to delete old file from Supabase:', error);
  }
}
`;

content = content.replace('async function startServer() {', helperFunctions + '\nasync function startServer() {');

// 1. /api/upload
content = content.replace(
  /const uploadDir = path\.join\(process\.cwd\(\), 'uploads', 'dokumen_pasien'\);[\s\S]*?res\.json\(\{ success: true, url: `\/uploads\/dokumen_pasien\/\$\{fileName\}` \}\);/,
  `const fileUrl = await uploadToSupabaseStorage(file, 'dokumen_pasien', \`\${type}_\${nik}\`);
      res.json({ success: true, url: fileUrl });`
);

// 2. /api/auth/upload-photo
content = content.replace(
  /const uploadDir = path\.join\(process\.cwd\(\), 'public', 'uploads', 'foto_pasien'\);[\s\S]*?const fileUrl = `\/uploads\/foto_pasien\/\$\{fileName\}`;/,
  `const fileUrl = await uploadToSupabaseStorage(image, 'foto_pasien', \`profile_\${userId}\`);`
);

// 3. /api/dokter POST
content = content.replace(
  /if \(foto_dokter && foto_dokter\.startsWith\('data:image'\)\) \{[\s\S]*?imageUrl = `\/uploads\/dokter\/\$\{fileName\}`;[\s\S]*?\}/,
  `if (foto_dokter && foto_dokter.startsWith('data:image')) {
        imageUrl = await uploadToSupabaseStorage(foto_dokter, 'dokter', 'dokter');
      }`
);

// 4. /api/dokter/:id PUT
content = content.replace(
  /if \(foto_dokter && foto_dokter\.startsWith\('data:image'\)\) \{[\s\S]*?imageUrl = `\/uploads\/dokter\/\$\{fileName\}`;[\s\S]*?\}/,
  `if (foto_dokter && foto_dokter.startsWith('data:image')) {
        imageUrl = await uploadToSupabaseStorage(foto_dokter, 'dokter', 'dokter');
      }`
);

// 5. /api/articles/:id DELETE
content = content.replace(
  /if \(article\?\.gambar_slider && article\.gambar_slider\.startsWith\('\/uploads\/'\)\) \{[\s\S]*?fs\.unlinkSync\(oldFilePath\);\s*\}\s*\}/,
  `if (article?.gambar_slider) {
        await deleteFromSupabaseStorage(article.gambar_slider);
      }`
);

// 6. /api/services/:id/images POST
content = content.replace(
  /const mimeType = matches\[1\];[\s\S]*?const imageUrl = `\/uploads\/fasilitas\/\$\{fileName\}`;/,
  `const imageUrl = await uploadToSupabaseStorage(image, 'fasilitas', \`fasilitas-\${id}\`);`
);

// 7. /api/services/:id/images/:imageId PUT
content = content.replace(
  /const mimeType = matches\[1\];[\s\S]*?const imageUrl = `\/uploads\/fasilitas\/\$\{fileName\}`;/,
  `const imageUrl = await uploadToSupabaseStorage(image, 'fasilitas', \`fasilitas-\${id}\`);`
);
content = content.replace(
  /if \(oldImageInfo\.image_url\.startsWith\('\/uploads\/'\)\) \{[\s\S]*?fs\.unlinkSync\(oldFilePath\);\s*\}\s*\}/,
  `if (oldImageInfo.image_url) {
          await deleteFromSupabaseStorage(oldImageInfo.image_url);
        }`
);

// 8. /api/services/:id/images/:imageId DELETE
content = content.replace(
  /if \(imageInfo\.image_url\.startsWith\('\/uploads\/'\)\) \{[\s\S]*?fs\.unlinkSync\(filePath\);\s*\}\s*\}/,
  `if (imageInfo.image_url) {
          await deleteFromSupabaseStorage(imageInfo.image_url);
        }`
);

// 9. /api/logos POST
content = content.replace(
  /const mimeType = matches\[1\];[\s\S]*?imageUrl = `\/uploads\/logos\/\$\{fileName\}`;/,
  `imageUrl = await uploadToSupabaseStorage(gambar_logo, 'logos', 'logo');`
);

// 10. /api/logos/:id PUT
content = content.replace(
  /const mimeType = matches\[1\];[\s\S]*?imageUrl = `\/uploads\/logos\/\$\{fileName\}`;/,
  `imageUrl = await uploadToSupabaseStorage(gambar_logo, 'logos', 'logo');`
);
content = content.replace(
  /if \(!oldLogoError && oldLogo && oldLogo\.gambar_logo\.startsWith\('\/uploads\/'\)\) \{[\s\S]*?fs\.unlinkSync\(oldFilePath\);\s*\}\s*\}/,
  `if (!oldLogoError && oldLogo && oldLogo.gambar_logo) {
            await deleteFromSupabaseStorage(oldLogo.gambar_logo);
          }`
);

// 11. /api/logos/:id DELETE
content = content.replace(
  /if \(logoInfo\.gambar_logo\.startsWith\('\/uploads\/'\)\) \{[\s\S]*?fs\.unlinkSync\(filePath\);\s*\}\s*\}/,
  `if (logoInfo.gambar_logo) {
          await deleteFromSupabaseStorage(logoInfo.gambar_logo);
        }`
);

// 12. /api/upload-article-image
content = content.replace(
  /const uploadDir = path\.join\(process\.cwd\(\), 'public', 'storage', 'artikel_slider'\);[\s\S]*?const fileUrl = `\/storage\/artikel_slider\/\$\{fileName\}`;/,
  `const fileUrl = await uploadToSupabaseStorage(image, 'artikel_slider', 'slider');`
);

// 13. /api/layanan-images POST
content = content.replace(
  /const uploadDir = path\.join\(process\.cwd\(\), 'public', 'uploads', 'layanan'\);[\s\S]*?const fileUrl = `\/uploads\/layanan\/\$\{fileName\}`;/,
  `const fileUrl = await uploadToSupabaseStorage(image, 'layanan', \`layanan_\${service_id}\`);`
);

// 14. /api/layanan-images/:id PUT
content = content.replace(
  /const buffer = Buffer\.from\(matches\[2\], 'base64'\);[\s\S]*?imageUrl = `\/uploads\/layanan\/\$\{fileName\}`;/,
  `imageUrl = await uploadToSupabaseStorage(image, 'layanan', \`layanan_\${service_id}\`);`
);
content = content.replace(
  /if \(oldImg\?\.image_url && oldImg\.image_url\.startsWith\('\/uploads\/'\)\) \{[\s\S]*?fs\.unlinkSync\(oldFilePath\);\s*\}\s*\}/,
  `if (oldImg?.image_url) {
            await deleteFromSupabaseStorage(oldImg.image_url);
          }`
);

// 15. /api/layanan-images/:id DELETE
content = content.replace(
  /if \(oldImg\?\.image_url && oldImg\.image_url\.startsWith\('\/uploads\/'\)\) \{[\s\S]*?fs\.unlinkSync\(oldFilePath\);\s*\}\s*\}/,
  `if (oldImg?.image_url) {
        await deleteFromSupabaseStorage(oldImg.image_url);
      }`
);

fs.writeFileSync('server.ts', content);
console.log('Done rewriting server.ts');

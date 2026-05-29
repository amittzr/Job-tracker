import app from './src/app.js';

const PORT = process.env.PORT || 3000;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server ready at http://0.0.0.0:${PORT}`);
  console.log(`📱 Mobile access: http://192.168.1.207:${PORT}`);
});
// Temporary debug script to test project fetching
console.log('🔍 Testing project API directly...');

fetch('http://localhost:5143/api/projects')
  .then(response => {
    console.log('✅ Response status:', response.status);
    console.log('✅ Response headers:', response.headers);
    return response.json();
  })
  .then(data => {
    console.log('✅ Projects data:', data);
    console.log('✅ Projects count:', data.length);
    console.log('✅ Projects type:', typeof data);
    console.log('✅ Is array:', Array.isArray(data));
  })
  .catch(error => {
    console.error('❌ Fetch error:', error);
  });
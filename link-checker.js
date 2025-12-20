// This is a stub to fix Render deployment misconfiguration
// Render is currently hardcoded to run 'node link-checker.js' 
// This script redirects to the actual server.
console.log("Redirecting to server.js...");
require('./server.js');

function readEnv(name) {
  const raw = process.env[name];
  if (raw == null || raw === '') {
    return '';
  }
  return String(raw).trim().replace(/^["']+|["']+$/g, '');
}

function isSet(name) {
  return readEnv(name).length > 0;
}

module.exports = { readEnv, isSet };

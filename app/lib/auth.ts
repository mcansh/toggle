import SecurePassword from 'secure-password';

const pwd = new SecurePassword();

async function hash(password: string) {
  const buffer = Buffer.from(password);
  const hashedBuffer = await pwd.hash(buffer);
  return hashedBuffer.toString('base64');
}

async function verify(hashedPassword: string, password: string) {
  try {
    const passwordBuffer = Buffer.from(password);
    const hashedPasswordBuffer = Buffer.from(hashedPassword);
    const result = await pwd.verify(passwordBuffer, hashedPasswordBuffer);
    return result;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export { pwd, hash, verify };

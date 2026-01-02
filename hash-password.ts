import bcrypt from "bcryptjs";

async function run() {
  const password = "frenchpassword";
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
}

run();

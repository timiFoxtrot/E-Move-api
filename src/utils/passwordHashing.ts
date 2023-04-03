import bcrypt from 'bcrypt'


export const toHash = async (password: string) => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

export const compare = async (storedPassword: string, suppliedPassword: string) => {
  return await bcrypt.compare(suppliedPassword, storedPassword)
}
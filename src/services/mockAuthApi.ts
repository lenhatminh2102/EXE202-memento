export type MockRole = 'client' | 'photographer' | 'admin'

export type MockAuthUser = {
  email: string
  name: string
  role: MockRole
}

type MockAccount = MockAuthUser & {
  password: string
}

// Temporary mock data. Keep credentials here instead of coupling them to UI.
const accounts: MockAccount[] = [
  { email: 'client1@memento.vn', password: '123456', role: 'client', name: 'Nguyễn Minh Châu' },
  { email: 'client2@memento.vn', password: '123456', role: 'client', name: 'Phạm Quang Minh' },
  { email: 'photographer1@memento.vn', password: '123456', role: 'photographer', name: 'Nguyễn Minh Tuấn' },
  { email: 'photographer2@memento.vn', password: '123456', role: 'photographer', name: 'Lê Thị Thu Hà' },
  { email: 'admin1@memento.vn', password: '123456', role: 'admin', name: 'Quản trị viên' },
  { email: 'admin2@memento.vn', password: '123456', role: 'admin', name: 'Điều hành Memento' },
]

export function authenticate(email: string, password: string): MockAuthUser | null {
  const account = accounts.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
  )

  if (!account) return null

  const { password: _password, ...user } = account
  return user
}

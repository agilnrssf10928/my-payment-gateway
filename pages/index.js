import { useState, useEffect } from 'react'

// Simulasi database dari GitHub
const GITHUB_DB_URL = 'https://raw.githubusercontent.com/agilnrssf10928/PAYMENT-/refs/heads/main/database.json'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Register state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await fetch(GITHUB_DB_URL)
      const data = await response.json()
      
      const foundUser = data.users?.find(u => u.email === email && u.password === password)
      
      if (foundUser) {
        localStorage.setItem('token', 'dummy-token-' + Date.now())
        localStorage.setItem('user', JSON.stringify(foundUser))
        setIsLoggedIn(true)
        setUser(foundUser)
      } else {
        setError('Email atau password salah')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (regData.password !== regData.confirmPassword) {
      setError('Password tidak cocok')
      return
    }

    try {
      const response = await fetch(GITHUB_DB_URL)
      const data = await response.json()
      
      if (data.users?.find(u => u.email === regData.email)) {
        setError('Email sudah terdaftar')
        return
      }

      const newUser = {
        id: Date.now().toString(),
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        password: regData.password,
        balance: 0,
        createdAt: new Date().toISOString()
      }

      // Simpan ke localStorage untuk demo
      const allUsers = data.users || []
      allUsers.push(newUser)
      
      // Untuk demo, kita simpan di localStorage
      localStorage.setItem('users', JSON.stringify(allUsers))
      localStorage.setItem('user', JSON.stringify(newUser))
      localStorage.setItem('token', 'dummy-token-' + Date.now())
      
      setIsLoggedIn(true)
      setUser(newUser)
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {showRegister ? 'Daftar Akun' : 'Login ke Payment Gateway'}
            </h2>
          </div>
          
          {!showRegister ? (
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <input
                    type="email"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Login
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
              <div className="rounded-md shadow-sm space-y-2">
                <div>
                  <input
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Nama Lengkap"
                    value={regData.name}
                    onChange={(e) => setRegData({...regData, name: e.target.value})}
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email"
                    value={regData.email}
                    onChange={(e) => setRegData({...regData, email: e.target.value})}
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Nomor Telepon"
                    value={regData.phone}
                    onChange={(e) => setRegData({...regData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={regData.password}
                    onChange={(e) => setRegData({...regData, password: e.target.value})}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Konfirmasi Password"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({...regData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Daftar
                </button>
              </div>
            </form>
          )}
          
          <div className="text-center">
            <button
              onClick={() => {
                setShowRegister(!showRegister)
                setError('')
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {showRegister ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar di sini'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

// Dashboard Component
function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [balance, setBalance] = useState(user?.balance || 0)
  const [transactions, setTransactions] = useState([])
  const [transferData, setTransferData] = useState({
    bank: '',
    accountNumber: '',
    amount: '',
    note: ''
  })
  const [qrisAmount, setQrisAmount] = useState('')
  const [qrisCode, setQrisCode] = useState('')
  const [showQRIS, setShowQRIS] = useState(false)

  const banks = ['BCA', 'BNI', 'BRI', 'Mandiri', 'BTN', 'CIMB Niaga', 'Danamon', 'Permata', 'Maybank', 'Bank Mega', 'Bank Sinarmas', 'Bank DBS', 'Bank UOB']

  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions')
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions))
    }
    const savedBalance = localStorage.getItem(`balance_${user?.id}`)
    if (savedBalance) {
      setBalance(parseFloat(savedBalance))
    }
  }, [user])

  const handleTransfer = (e) => {
    e.preventDefault()
    
    if (parseFloat(transferData.amount) > balance) {
      alert('Saldo tidak mencukupi!')
      return
    }

    const newTransaction = {
      id: Date.now().toString(),
      type: 'transfer',
      amount: -parseFloat(transferData.amount),
      bank: transferData.bank,
      accountNumber: transferData.accountNumber,
      note: transferData.note,
      date: new Date().toISOString(),
      status: 'completed'
    }

    const updatedTransactions = [newTransaction, ...transactions]
    setTransactions(updatedTransactions)
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions))

    const newBalance = balance - parseFloat(transferData.amount)
    setBalance(newBalance)
    localStorage.setItem(`balance_${user.id}`, newBalance.toString())

    alert('Transfer berhasil!')
    setTransferData({ bank: '', accountNumber: '', amount: '', note: '' })
  }

  const generateQRIS = async () => {
    if (!qrisAmount || parseFloat(qrisAmount) <= 0) {
      alert('Masukkan jumlah yang valid!')
      return
    }

    const qrisData = {
      id: Date.now().toString(),
      merchant: 'Payment Gateway',
      amount: parseFloat(qrisAmount),
      timestamp: new Date().toISOString(),
      reference: 'QR-' + Date.now()
    }

    try {
      // Simulasi generate QR code
      const qrCodeData = JSON.stringify(qrisData)
      // Untuk demo, kita encode ke base64
      const qrCode = btoa(qrCodeData)
      setQrisCode(qrCode)
      setShowQRIS(true)
    } catch (err) {
      alert('Gagal generate QRIS')
    }
  }

  const handleScanQRIS = () => {
    // Simulasi scan QRIS
    if (!qrisCode) {
      alert('Silakan generate QRIS terlebih dahulu')
      return
    }

    try {
      const qrisData = JSON.parse(atob(qrisCode))
      
      const newTransaction = {
        id: Date.now().toString(),
        type: 'receive',
        amount: qrisData.amount,
        reference: qrisData.reference,
        date: new Date().toISOString(),
        status: 'completed',
        note: 'Pembayaran QRIS'
      }

      const updatedTransactions = [newTransaction, ...transactions]
      setTransactions(updatedTransactions)
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions))

      const newBalance = balance + qrisData.amount
      setBalance(newBalance)
      localStorage.setItem(`balance_${user.id}`, newBalance.toString())

      alert(`Pembayaran berhasil! +Rp${qrisData.amount.toLocaleString()}`)
      setShowQRIS(false)
      setQrisCode('')
    } catch (err) {
      alert('QRIS tidak valid!')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap">
          <h1 className="text-2xl font-bold">Payment Gateway</h1>
          <div className="flex items-center space-x-4 flex-wrap">
            <span className="text-sm">Halo, {user?.name}</span>
            <button
              onClick={onLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-600">Total Saldo</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(balance)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Total Transaksi</p>
              <p className="text-3xl font-bold text-green-600">{transactions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Status</p>
              <p className="text-3xl font-bold text-green-600">Aktif</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['dashboard', 'transfer', 'qris', 'history', 'profile'].map(tab => (
              <button
                key={tab}
                className={`px-4 py-2 rounded capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Saldo Anda</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(balance)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">QRIS Terakhir</h3>
                  {transactions.filter(t => t.type === 'receive').length > 0 ? (
                    <p>QRIS Active</p>
                  ) : (
                    <p className="text-gray-500">Belum ada QRIS</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Transfer ke Semua Bank</h2>
              <form onSubmit={handleTransfer} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pilih Bank</label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    value={transferData.bank}
                    onChange={(e) => setTransferData({...transferData, bank: e.target.value})}
                  >
                    <option value="">Pilih Bank</option>
                    {banks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor Rekening</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    value={transferData.accountNumber}
                    onChange={(e) => setTransferData({...transferData, accountNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catatan (Opsional)</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    value={transferData.note}
                    onChange={(e) => setTransferData({...transferData, note: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Transfer Sekarang
                </button>
              </form>
            </div>
          )}

          {activeTab === 'qris' && (
            <div>
              <h2 className="text-xl font-bold mb-4">QRIS Payment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Buat QRIS</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        value={qrisAmount}
                        onChange={(e) => setQrisAmount(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={generateQRIS}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                      Generate QRIS
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Scan QRIS</h3>
                  <button
                    onClick={handleScanQRIS}
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Scan & Bayar
                  </button>
                  {showQRIS && qrisCode && (
                    <div className="mt-4 text-center">
                      <h4 className="font-semibold">QRIS Code</h4>
                      <div className="bg-gray-100 p-4 rounded mt-2 break-all text-xs">
                        {qrisCode}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Jumlah: {formatCurrency(parseFloat(qrisAmount))}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(qrisCode)
                          alert('QRIS code copied!')
                        }}
                        className="mt-2 bg-gray-600 text-white px-4 py-2 rounded text-sm"
                      >
                        Copy QRIS Code
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-bold mb-4">History Transaksi</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-500">Belum ada transaksi</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`p-4 border rounded ${
                        transaction.type === 'transfer' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex justify-between items-start flex-wrap">
                        <div>
                          <p className="font-semibold">
                            {transaction.type === 'transfer' ? 'Transfer Keluar' : 'Penerimaan'}
                          </p>
                          {transaction.type === 'transfer' ? (
                            <>
                              <p className="text-sm text-gray-600">Bank: {transaction.bank}</p>
                              <p className="text-sm text-gray-600">No. Rekening: {transaction.accountNumber}</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-600">Pembayaran QRIS</p>
                          )}
                          {transaction.note && (
                            <p className="text-sm text-gray-600">Catatan: {transaction.note}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${transaction.type === 'transfer' ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.type === 'transfer' ? '-' : '+'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                          <p className={`text-sm ${transaction.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {transaction.status === 'completed' ? 'Selesai' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 flex-wrap">
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user?.name}</h3>
                    <p className="text-gray-600">{user?.email}</p>
                    <p className="text-gray-600">{user?.phone}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">ID Pengguna</p>
                      <p className="font-mono text-sm">{user?.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bergabung Sejak</p>
                      <p className="text-sm">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

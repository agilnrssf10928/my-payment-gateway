import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import axios from 'axios'

// ============ DATABASE ============
const DB = {
  getUsers: async () => {
    try {
      const response = await axios.get('/api/github')
      return response.data.users || []
    } catch {
      const localData = localStorage.getItem('payment_users_backup')
      return localData ? JSON.parse(localData) : []
    }
  },
  saveUsers: async (users) => {
    try {
      await axios.post('/api/github', { users })
      localStorage.setItem('payment_users_backup', JSON.stringify(users))
      return true
    } catch {
      localStorage.setItem('payment_users_backup', JSON.stringify(users))
      return false
    }
  },
  getUser: async (email) => {
    const users = await DB.getUsers()
    return users.find(u => u.email === email)
  },
  addUser: async (user) => {
    const users = await DB.getUsers()
    users.push(user)
    await DB.saveUsers(users)
    return user
  },
  getTransactions: (userId) => {
    try {
      const data = localStorage.getItem(`transactions_${userId}`)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },
  saveTransactions: (userId, transactions) => {
    localStorage.setItem(`transactions_${userId}`, JSON.stringify(transactions))
  },
  getBalance: (userId) => {
    try {
      const data = localStorage.getItem(`balance_${userId}`)
      return data ? parseFloat(data) : 0
    } catch {
      return 0
    }
  },
  saveBalance: (userId, balance) => {
    localStorage.setItem(`balance_${userId}`, balance.toString())
  },
  getQRIS: (userId) => {
    try {
      const data = localStorage.getItem(`qris_${userId}`)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },
  saveQRIS: (userId, qrisData) => {
    localStorage.setItem(`qris_${userId}`, JSON.stringify(qrisData))
  }
}

// ============ QRIS SCANNER COMPONENT (FIX UI & KAMERA) ============
function QRISScanner({ onScanSuccess, onScanError }) {
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef(null)
  const [error, setError] = useState('')
  const [BrowserMultiFormatReader, setBrowserMultiFormatReader] = useState(null)
  const readerRef = useRef(null)

  useEffect(() => {
    import('@zxing/library').then(module => {
      setBrowserMultiFormatReader(() => module.BrowserMultiFormatReader)
    }).catch(err => {
      console.error('Failed to load @zxing/library:', err)
    })
  }, [])

  const startScanning = async () => {
    if (!BrowserMultiFormatReader) {
      alert('❌ Scanner belum siap!')
      return
    }

    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader
      
      const videoInputDevices = await reader.listVideoInputDevices()
      
      if (videoInputDevices.length === 0) {
        alert('❌ Tidak ada kamera yang terdeteksi!')
        return
      }

      // Pilih kamera belakang jika ada
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment')
      )
      
      const selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId

      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const text = result.getText()
            console.log('QRIS Scanned:', text)
            onScanSuccess(text)
            stopScanning()
          }
        }
      )

      setIsScanning(true)
      setError('')
    } catch (err) {
      console.error('Scanner error:', err)
      setError('Gagal mengakses kamera: ' + err.message)
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (readerRef.current) {
      try {
        readerRef.current.reset()
        readerRef.current = null
      } catch (e) {}
    }
    setIsScanning(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-50 border border-red-500 text-red-600 p-3 rounded-lg mb-4">
          ❌ {error}
        </div>
      )}
      
      <div className="mb-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition text-lg font-semibold"
          >
            📷 Mulai Scan QRIS (Buka Kamera)
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition text-lg font-semibold"
          >
            ⏹ Stop Scanning
          </button>
        )}
      </div>
      
      <div className="w-full bg-black rounded-lg overflow-hidden relative" style={{ minHeight: '300px' }}>
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ minHeight: '300px' }}
        />
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <p className="text-gray-500">Tekan tombol hijau di atas untuk membuka kamera</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============ MAIN APP ============
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [user, setUser] = useState(null)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        await DB.getUsers()
      } catch (err) {
        console.error('Error loading users:', err)
      } finally {
        setIsLoadingUsers(false)
      }
    }
    loadUsers()
  }, [])

  useEffect(() => {
    const session = localStorage.getItem('payment_session')
    if (session) {
      try {
        const userData = JSON.parse(session)
        setUser(userData)
        setIsLoggedIn(true)
      } catch {
        localStorage.removeItem('payment_session')
      }
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const foundUser = await DB.getUser(loginData.email)
      
      if (!foundUser) {
        setError('Email tidak ditemukan!')
        setLoading(false)
        return
      }

      if (foundUser.password !== loginData.password) {
        setError('Password salah!')
        setLoading(false)
        return
      }

      const balance = DB.getBalance(foundUser.id)
      foundUser.balance = balance

      localStorage.setItem('payment_session', JSON.stringify(foundUser))
      setUser(foundUser)
      setIsLoggedIn(true)
      setLoading(false)
      setLoginData({ email: '', password: '' })
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!regData.name || !regData.email || !regData.phone || !regData.password || !regData.confirmPassword) {
      setError('Semua field harus diisi!')
      setLoading(false)
      return
    }

    if (regData.name.length < 3) {
      setError('Nama minimal 3 karakter!')
      setLoading(false)
      return
    }

    if (!regData.email.includes('@') || !regData.email.includes('.')) {
      setError('Email tidak valid!')
      setLoading(false)
      return
    }

    if (regData.phone.length < 10 || regData.phone.length > 15) {
      setError('Nomor telepon harus 10-15 digit!')
      setLoading(false)
      return
    }

    if (regData.password.length < 6) {
      setError('Password minimal 6 karakter!')
      setLoading(false)
      return
    }

    if (regData.password !== regData.confirmPassword) {
      setError('Password tidak cocok!')
      setLoading(false)
      return
    }

    try {
      const existingUser = await DB.getUser(regData.email)
      if (existingUser) {
        setError('Email sudah terdaftar!')
        setLoading(false)
        return
      }

      const users = await DB.getUsers()
      if (users.find(u => u.phone === regData.phone)) {
        setError('Nomor telepon sudah terdaftar!')
        setLoading(false)
        return
      }

      const newUser = {
        id: 'user_' + Date.now(),
        name: regData.name.trim(),
        email: regData.email.trim().toLowerCase(),
        phone: regData.phone.trim(),
        password: regData.password,
        balance: 0,
        createdAt: new Date().toISOString()
      }

      await DB.addUser(newUser)
      DB.saveBalance(newUser.id, 0)
      DB.saveQRIS(newUser.id, [])

      localStorage.setItem('payment_session', JSON.stringify(newUser))
      setUser(newUser)
      setIsLoggedIn(true)
      setLoading(false)
      setRegData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      })
      
      alert('✅ Pendaftaran berhasil! Data tersimpan di GitHub.')
    } catch (err) {
      console.error('Register error:', err)
      setError('Gagal menyimpan data ke GitHub. Coba lagi.')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('payment_session')
    setIsLoggedIn(false)
    setUser(null)
  }

  if (isLoadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl text-gray-600">⏳ Loading data...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              {showRegister ? '✨ Daftar Akun' : '🔐 Login'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {showRegister ? 'Data akan tersimpan di GitHub' : 'Masuk ke akun Anda'}
            </p>
          </div>
          
          {!showRegister ? (
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? '⏳ Loading...' : 'Login'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(true)
                    setError('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Belum punya akun? Daftar di sini
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Nama Lengkap"
                    value={regData.name}
                    onChange={(e) => setRegData({...regData, name: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Email"
                    value={regData.email}
                    onChange={(e) => setRegData({...regData, email: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Nomor Telepon"
                    value={regData.phone}
                    onChange={(e) => setRegData({...regData, phone: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Password (min 6 karakter)"
                    value={regData.password}
                    onChange={(e) => setRegData({...regData, password: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Konfirmasi Password"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({...regData, confirmPassword: e.target.value})}
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? '⏳ Proses...' : 'Daftar'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(false)
                    setError('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Sudah punya akun? Login di sini
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

// ============ DASHBOARD ============
function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [balance, setBalance] = useState(DB.getBalance(user.id))
  const [transactions, setTransactions] = useState(DB.getTransactions(user.id))
  const [transferData, setTransferData] = useState({
    bank: '',
    accountNumber: '',
    amount: '',
    note: ''
  })
  const [qrisAmount, setQrisAmount] = useState('')
  const [qrisImage, setQrisImage] = useState('')
  const [qrisCode, setQrisCode] = useState('')
  const [showQRIS, setShowQRIS] = useState(false)
  const [scanResult, setScanResult] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const banks = ['BCA', 'BNI', 'BRI', 'Mandiri', 'BTN', 'CIMB Niaga', 'Danamon', 'Permata', 'Maybank', 'Bank Mega', 'Bank Sinarmas']

  // ============ GENERATE QRIS (Simulasi Payment Gateway) ============
  const generateQRIS = async () => {
    if (!qrisAmount || parseFloat(qrisAmount) <= 0) {
      alert('❌ Masukkan jumlah yang valid!')
      return
    }

    const amount = parseFloat(qrisAmount)
    const txnId = 'QR-' + Date.now().toString()

    // Data QRIS yang bisa dibaca oleh WEBSITE INI SENDIRI
    // (TIDAK BISA dibaca DANA, karena butuh server resmi BI)
    const qrisPayload = {
      merchantId: user.id,
      merchantName: user.name,
      amount: amount,
      transactionId: txnId,
      timestamp: new Date().toISOString()
    }

    const qrString = JSON.stringify(qrisPayload)

    try {
      const qrCodeImage = await QRCode.toDataURL(qrString, {
        width: 400,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      })
      
      setQrisImage(qrCodeImage)
      setQrisCode(qrString)
      setShowQRIS(true)
      
      const qrisList = DB.getQRIS(user.id)
      qrisList.push({
        id: 'qris_' + Date.now(),
        ...qrisPayload,
        qrImage: qrCodeImage,
        status: 'active',
        createdAt: new Date().toISOString()
      })
      DB.saveQRIS(user.id, qrisList)
      
      alert(`✅ QRIS berhasil dibuat!\n\n📱 Buka aplikasi Payment Gateway ini di HP/PC lain, lalu Scan QRIS ini.`)
    } catch (err) {
      console.error('QRIS Error:', err)
      alert('❌ Gagal membuat QRIS!')
    }
  }

  // ============ PROSES SCAN QRIS DI WEB INI ============
  const handleScanSuccess = (decodedText) => {
    console.log('QRIS Scanned:', decodedText)
    setIsProcessing(true)
    setScanResult(decodedText)
    
    try {
      const qrisData = JSON.parse(decodedText)
      
      const amount = parseFloat(qrisData.amount)
      const merchantName = qrisData.merchantName || 'Merchant'
      const merchantId = qrisData.merchantId
      const txnId = qrisData.transactionId || 'QRIS'

      if (!amount) {
        alert('❌ QRIS tidak valid!')
        setIsProcessing(false)
        return
      }

      // Cek apakah QRIS ini milik user sendiri
      if (merchantId === user.id) {
        alert('❌ Tidak bisa scan QRIS sendiri!')
        setIsProcessing(false)
        return
      }

      // Cek saldo
      if (balance < amount) {
        alert(`❌ Saldo tidak mencukupi!\nSaldo: Rp${balance.toLocaleString()}\nTagihan: Rp${amount.toLocaleString()}`)
        setIsProcessing(false)
        return
      }

      // Kurangi saldo pembayar
      const newPayerBalance = balance - amount
      setBalance(newPayerBalance)
      DB.saveBalance(user.id, newPayerBalance)

      // Catat transaksi
      const payerTransactions = [{
        id: 'tx_' + Date.now(),
        type: 'transfer',
        amount: -amount,
        reference: txnId,
        to: merchantName,
        date: new Date().toISOString(),
        status: 'completed',
        note: `Pembayaran QRIS ke ${merchantName} (${txnId})`
      }, ...transactions]
      setTransactions(payerTransactions)
      DB.saveTransactions(user.id, payerTransactions)

      alert(`✅ Pembayaran berhasil!\n\n💳 Jumlah: -Rp${amount.toLocaleString()}\n🏪 Merchant: ${merchantName}\n📋 Referensi: ${txnId}`)
      
      setScanResult('')
      setIsProcessing(false)
      setShowScanner(false)
    } catch (err) {
      console.error('Parse error:', err)
      alert('❌ QRIS tidak valid!')
      setIsProcessing(false)
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
      <nav className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap">
          <h1 className="text-2xl font-bold">💰 Payment Gateway</h1>
          <div className="flex items-center space-x-4 flex-wrap">
            <span className="text-sm">👋 {user?.name}</span>
            <button
              onClick={onLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-sm transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm">Total Saldo</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(balance)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm">Total Transaksi</p>
            <p className="text-2xl font-bold text-green-600">{transactions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm">Status</p>
            <p className="text-2xl font-bold text-green-600">✅ Aktif</p>
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="flex flex-nowrap gap-2">
            {[
              { id: 'dashboard', icon: '📊', label: 'Dashboard' },
              { id: 'transfer', icon: '💸', label: 'Transfer' },
              { id: 'qris', icon: '📱', label: 'Buat QRIS' },
              { id: 'scan', icon: '📷', label: 'Scan QRIS' },
              { id: 'history', icon: '📜', label: 'History' },
              { id: 'profile', icon: '👤', label: 'Profile' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id !== 'scan') {
                    setShowScanner(false)
                  }
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-xl font-bold mb-4">📊 Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Saldo Anda</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(balance)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Transaksi Terakhir</h3>
                  {transactions.length > 0 ? (
                    <div>
                      <p className="text-sm">
                        {transactions[0].type === 'transfer' ? 'Transfer keluar' : 'Penerimaan'} -{' '}
                        {formatCurrency(Math.abs(transactions[0].amount))}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(transactions[0].date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Belum ada transaksi</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div>
              <h2 className="text-xl font-bold mb-4">💸 Transfer ke Bank</h2>
              <form onSubmit={(e) => {
                e.preventDefault()
                if (!transferData.bank || !transferData.accountNumber || !transferData.amount) {
                  alert('❌ Semua field harus diisi!')
                  return
                }

                const amount = parseFloat(transferData.amount)
                if (amount <= 0) {
                  alert('❌ Jumlah transfer harus lebih dari 0!')
                  return
                }

                if (amount > balance) {
                  alert(`❌ Saldo tidak mencukupi!\nSaldo Anda: Rp${balance.toLocaleString()}`)
                  return
                }

                const newTransaction = {
                  id: 'tx_' + Date.now(),
                  type: 'transfer',
                  amount: -amount,
                  bank: transferData.bank,
                  accountNumber: transferData.accountNumber,
                  note: transferData.note || '-',
                  date: new Date().toISOString(),
                  status: 'completed'
                }

                const updatedTransactions = [newTransaction, ...transactions]
                setTransactions(updatedTransactions)
                DB.saveTransactions(user.id, updatedTransactions)

                const newBalance = balance - amount
                setBalance(newBalance)
                DB.saveBalance(user.id, newBalance)

                alert(`✅ Transfer berhasil!\nBank: ${transferData.bank}\nJumlah: Rp${amount.toLocaleString()}`)
                setTransferData({ bank: '', accountNumber: '', amount: '', note: '' })
              }} className="space-y-4 max-w-md">
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
                    placeholder="Masukkan nomor rekening"
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
                    placeholder="Masukkan jumlah"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catatan (Opsional)</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    value={transferData.note}
                    onChange={(e) => setTransferData({...transferData, note: e.target.value})}
                    placeholder="Catatan transfer"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Transfer Sekarang
                </button>
              </form>
            </div>
          )}

          {activeTab === 'qris' && (
            <div>
              <h2 className="text-xl font-bold mb-4">📱 Generate QRIS Internal</h2>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <b>Catatan Penting:</b> QRIS yang di-generate di sini hanya bisa di-scan oleh aplikasi Payment Gateway ini sendiri. Untuk discan DANA/OVO/BCA, Anda perlu menyewa Payment Gateway resmi (Midtrans/Xendit) karena QRIS asli harus didaftarkan ke Bank Indonesia.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">Buat QRIS</h3>
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
                        placeholder="Masukkan jumlah"
                      />
                    </div>
                    <button
                      onClick={generateQRIS}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                    >
                      Generate QRIS
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">QRIS Aktif</h3>
                  {showQRIS && qrisImage ? (
                    <div className="text-center">
                      <img 
                        src={qrisImage} 
                        alt="QRIS" 
                        className="mx-auto border-2 border-blue-500 rounded-lg p-2 bg-white"
                        style={{ maxWidth: '250px' }}
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        Jumlah: {formatCurrency(parseFloat(qrisAmount))}
                      </p>
                      <p className="text-xs text-green-600 mt-1">✅ Bisa di-scan di menu "Scan QRIS"</p>
                      <div className="mt-3 flex flex-col gap-2">
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.download = 'qris.png'
                            link.href = qrisImage
                            link.click()
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition"
                        >
                          📥 Download QRIS
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(qrisCode)
                            alert('✅ QRIS code copied!')
                          }}
                          className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition"
                        >
                          📋 Copy QRIS Code
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Belum ada QRIS yang dibuat</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scan' && (
            <div>
              <h2 className="text-xl font-bold mb-4">📷 Scan QRIS</h2>
              <p className="text-sm text-gray-600 mb-4">
                Arahkan kamera ke QRIS yang di-generate oleh pengguna lain.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {!showScanner ? (
                    <button
                      onClick={() => setShowScanner(true)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition text-lg font-semibold"
                    >
                      📷 Buka Kamera Scan QRIS
                    </button>
                  ) : (
                    <QRISScanner 
                      onScanSuccess={handleScanSuccess}
                    />
                  )}
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">Hasil Scan</h3>
                  {isProcessing ? (
                    <div className="text-center py-8">
                      <p className="text-blue-600">⏳ Memproses pembayaran...</p>
                    </div>
                  ) : scanResult ? (
                    <div className="bg-white p-4 rounded-lg border border-green-500">
                      <p className="text-green-600 font-bold">✅ QRIS Terdeteksi!</p>
                      <p className="text-sm text-gray-600 mt-2 break-all">
                        Data: {scanResult.substring(0, 100)}...
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Belum ada QRIS yang di-scan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-bold mb-4">📜 History Transaksi</h2>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`p-4 border rounded-lg ${
                        transaction.type === 'transfer' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="flex-1">
                          <p className="font-semibold">
                            {transaction.type === 'transfer' ? '🔴 Transfer Keluar' : '🟢 Penerimaan'}
                          </p>
                          {transaction.bank && (
                            <p className="text-sm text-gray-600">🏦 Bank: {transaction.bank}</p>
                          )}
                          {transaction.accountNumber && (
                            <p className="text-sm text-gray-600">📋 No. Rekening: {transaction.accountNumber}</p>
                          )}
                          {transaction.to && (
                            <p className="text-sm text-gray-600">👤 Kepada: {transaction.to}</p>
                          )}
                          {transaction.from && (
                            <p className="text-sm text-gray-600">👤 Dari: {transaction.from}</p>
                          )}
                          {transaction.note && transaction.note !== '-' && (
                            <p className="text-sm text-gray-600">📝 Catatan: {transaction.note}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            🕐 {new Date(transaction.date).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${transaction.type === 'transfer' ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.type === 'transfer' ? '-' : '+'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                          <p className="text-xs text-green-600">✅ Selesai</p>
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
              <h2 className="text-xl font-bold mb-4">👤 Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 flex-wrap">
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user?.name}</h3>
                    <p className="text-gray-600">📧 {user?.email}</p>
                    <p className="text-gray-600">📱 {user?.phone}</p>
                    <p className="text-xs text-gray-400 mt-1">✅ Data tersimpan di GitHub</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">🆔 ID Pengguna</p>
                      <p className="font-mono text-sm break-all">{user?.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">📅 Bergabung Sejak</p>
                      <p className="text-sm">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">💳 Total Saldo</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(balance)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

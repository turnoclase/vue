import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  signInAnonymously,
  type UserCredential,
} from 'firebase/auth'
import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentReference,
  type Unsubscribe,
  type Timestamp,
} from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { nombreAleatorio } from '@/composables/nombres'
import router from '@/router'

export interface AulaHistorico {
  id: string
  codigo: string
  etiqueta: string
}

export type EstadoTurno =
  | { tipo: 'enCola'; posicion: number }
  | { tipo: 'esTuTurno' }
  | { tipo: 'volverAEmpezar' }
  | { tipo: 'esperando' }
  | { tipo: 'error'; mensaje: string }

function withTimeout<T>(seconds: number, fn: () => Promise<T>): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), seconds * 1000),
    ),
  ])
}

const LS_HISTORICO = 'historicoAulas'
const LS_CODIGO = 'codigoAula'
const LS_NOMBRE = 'nombreUsuario'

function cargarHistorico(): AulaHistorico[] {
  try {
    return JSON.parse(localStorage.getItem(LS_HISTORICO) ?? '[]')
  } catch {
    return []
  }
}

function guardarHistorico(lista: AulaHistorico[]) {
  localStorage.setItem(LS_HISTORICO, JSON.stringify(lista))
}

export const useConexionStore = defineStore('conexion', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const codigoAula = ref(localStorage.getItem(LS_CODIGO) ?? '')
  const nombreUsuario = ref(localStorage.getItem(LS_NOMBRE) ?? '')
  const placeholder = ref('')
  const historicoAulas = ref<AulaHistorico[]>(cargarHistorico())

  const mostrandoTurno = ref(false)
  const codigoAulaActual = ref('')
  const estadoTurno = ref<EstadoTurno>({ tipo: 'enCola', posicion: 0 })

  const minutosRestantes = ref(0)
  const segundosRestantes = ref(0)
  const mostrarCronometro = ref(false)
  const mostrarBotonActualizar = ref(false)
  const mostrarError = ref(false)
  const cargando = ref(true)
  const errorRed = ref(false)

  // ── Internal (non-reactive) ────────────────────────────────────────────────
  let uid: string | null = null
  let refAula: DocumentReference | null = null
  let refPosicion: DocumentReference | null = null
  let unsubAula: Unsubscribe | null = null
  let unsubCola: Unsubscribe | null = null
  let unsubPosicion: Unsubscribe | null = null

  let timer: ReturnType<typeof setInterval> | null = null
  let ultimaPeticion: Date | null = null
  let segundosEspera = 300
  let pedirTurno = true
  let atendido = false
  let encolando = false
  let inicioCarga: Date = new Date(0)
  let pantallaAbortController: AbortController | null = null

  // ── Computed ───────────────────────────────────────────────────────────────
  const nombreEfectivo = computed(() =>
    nombreUsuario.value.trim() || placeholder.value,
  )

  const puedeConectar = computed(
    () => codigoAula.value.length === 5 && nombreEfectivo.value.length >= 2,
  )

  // ── Carga helpers ──────────────────────────────────────────────────────────
  function iniciarCarga() {
    inicioCarga = new Date()
    cargando.value = true
  }

  function terminarCarga() {
    const transcurrido = Date.now() - inicioCarga.getTime()
    const restante = 1000 - transcurrido
    if (restante > 0) {
      setTimeout(() => {
        cargando.value = false
      }, restante)
    } else {
      cargando.value = false
    }
  }

  // ── Cronómetro ─────────────────────────────────────────────────────────────
  function iniciarCronometro() {
    reiniciarCronometro()
    actualizarDisplayCronometro()
    timer = setInterval(tickCronometro, 1000)
  }

  function reiniciarCronometro() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    minutosRestantes.value = 0
    segundosRestantes.value = 0
  }

  function actualizarDisplayCronometro() {
    const total = tiempoEsperaRestante()
    minutosRestantes.value = Math.floor(total / 60)
    segundosRestantes.value = total % 60
  }

  function tickCronometro() {
    const total = tiempoEsperaRestante()
    if (total <= 0) {
      reiniciarCronometro()
      estadoTurno.value = { tipo: 'volverAEmpezar' }
      mostrarCronometro.value = false
      mostrarBotonActualizar.value = true
      mostrarError.value = false
      return
    }
    minutosRestantes.value = Math.floor(total / 60)
    segundosRestantes.value = total % 60
  }

  function tiempoEsperaRestante(): number {
    if (!ultimaPeticion) return 0
    const transcurrido = Math.floor((Date.now() - ultimaPeticion.getTime()) / 1000)
    return Math.max(0, segundosEspera - transcurrido)
  }

  // ── Firebase helpers ───────────────────────────────────────────────────────
  async function recuperarUltimaPeticion() {
    if (!uid || !refAula) return
    try {
      const docSnap = await getDoc(doc(refAula, 'espera', uid))
      if (docSnap.exists()) {
        const ts = docSnap.data()?.timestamp as Timestamp | undefined
        ultimaPeticion = ts ? ts.toDate() : null
      } else {
        ultimaPeticion = null
      }
    } catch {
      ultimaPeticion = null
    }
  }

  async function borrarUltimaPeticion() {
    if (!uid || !refAula) return
    try {
      await deleteDoc(doc(refAula, 'espera', uid))
    } catch {
      // silencioso
    }
  }

  async function actualizarAlumno(nombre: string) {
    if (!uid) return
    try {
      await setDoc(doc(db, 'alumnos', uid), { nombre }, { merge: true })
    } catch {
      // silencioso
    }
  }

  // ── actualizarPantalla ─────────────────────────────────────────────────────
  function actualizarPantalla() {
    if (!refAula || !refPosicion) {
      estadoTurno.value = { tipo: 'error', mensaje: 'Aula no encontrada' }
      actualizarUI()
      return
    }

    pantallaAbortController?.abort()
    pantallaAbortController = new AbortController()
    const signal = pantallaAbortController.signal

    const posRef = refPosicion
    const aulaRef = refAula

    getDoc(posRef).then(async (posDoc) => {
      if (signal.aborted) return
      if (!posDoc.exists()) {
        atendido = true
        await manejarAtendido()
        return
      }
      const datos = posDoc.data()
      const timestamp = datos?.timestamp as Timestamp | undefined
      if (!timestamp) return

      const q = query(
        collection(aulaRef, 'cola'),
        where('timestamp', '<=', timestamp),
      )
      const snap = await getDocs(q)
      if (signal.aborted) return

      const posicion = snap.size
      if (posicion > 1) {
        estadoTurno.value = { tipo: 'enCola', posicion: posicion - 1 }
      } else if (posicion === 1) {
        estadoTurno.value = { tipo: 'esTuTurno' }
      }
      terminarCarga()
      actualizarUI()
    }).catch(() => {
      if (signal.aborted) return
      terminarCarga()
    })
  }

  // ── manejarAtendido ────────────────────────────────────────────────────────
  async function manejarAtendido() {
    await recuperarUltimaPeticion()
    if (segundosEspera > 0 && tiempoEsperaRestante() > 0) {
      estadoTurno.value = { tipo: 'esperando' }
      mostrarCronometro.value = true
      mostrarBotonActualizar.value = false
      mostrarError.value = false
      iniciarCronometro()
      actualizarUI()
    } else {
      reiniciarCronometro()
      borrarUltimaPeticion()
      estadoTurno.value = { tipo: 'volverAEmpezar' }
      mostrarCronometro.value = false
      mostrarBotonActualizar.value = true
      mostrarError.value = false
      terminarCarga()
    }
  }

  function actualizarUI() {
    terminarCarga()
    if (estadoTurno.value.tipo === 'esperando') {
      mostrarCronometro.value = true
      mostrarBotonActualizar.value = false
      mostrarError.value = false
    } else if (estadoTurno.value.tipo === 'error') {
      mostrarCronometro.value = false
      mostrarBotonActualizar.value = false
      mostrarError.value = true
    } else {
      mostrarCronometro.value = false
      mostrarBotonActualizar.value = false
      mostrarError.value = false
    }
  }

  // ── Listeners ──────────────────────────────────────────────────────────────
  function conectarListenerPosicion(posRef: DocumentReference) {
    if (unsubPosicion) return
    unsubPosicion = onSnapshot(posRef, (snap) => {
      if (!snap.exists()) {
        atendido = true
        manejarAtendido()
      }
    })
  }

  function desconectarListenerPosicion() {
    unsubPosicion?.()
    unsubPosicion = null
  }

  function procesarCola(docs: { id: string; ref: DocumentReference }[]) {
    if (!refAula || !uid) return

    const primerDoc = docs[0]
    if (primerDoc !== undefined) {
      pedirTurno = false
      refPosicion = primerDoc.ref
      desconectarListenerPosicion()
      conectarListenerPosicion(primerDoc.ref)
      actualizarPantalla()
    } else if (pedirTurno) {
      if (encolando) return
      pedirTurno = false
      encolando = true

      const aulaRef = refAula
      const alumnoUid = uid

      recuperarUltimaPeticion().then(() => {
        if (tiempoEsperaRestante() > 0) {
          encolando = false
          estadoTurno.value = { tipo: 'esperando' }
          mostrarCronometro.value = true
          mostrarBotonActualizar.value = false
          mostrarError.value = false
          iniciarCronometro()
          actualizarUI()
        } else {
          mostrarCronometro.value = false
          mostrarBotonActualizar.value = false
          mostrarError.value = false
          reiniciarCronometro()
          borrarUltimaPeticion()

          addDoc(collection(aulaRef, 'cola'), {
            alumno: alumnoUid,
            timestamp: serverTimestamp(),
          }).then((ref) => {
            refPosicion = ref
            desconectarListenerPosicion()
            conectarListenerPosicion(ref)
            actualizarPantalla()
          }).catch(() => {
            // silencioso
          }).finally(() => {
            encolando = false
          })
        }
      })
    } else {
      manejarAtendido()
    }
  }

  function buscarAlumnoEnCola() {
    if (!uid || !refAula) return
    const alumnoUid = uid
    const aulaRef = refAula

    getDocs(
      query(
        collection(aulaRef, 'cola'),
        where('alumno', '==', alumnoUid),
        limit(1),
      ),
    ).then((snap) => {
      procesarCola(snap.docs.map((d) => ({ id: d.id, ref: d.ref })))
    }).catch(() => {
      errorRed.value = true
      estadoTurno.value = { tipo: 'error', mensaje: 'Error de conexión' }
      actualizarUI()
    })
  }

  function conectarListenerCola() {
    if (unsubCola || !refAula) return
    const aulaRef = refAula
    unsubCola = onSnapshot(collection(aulaRef, 'cola'), () => {
      buscarAlumnoEnCola()
    })
  }

  function conectarListenerAula(aulaRef: DocumentReference, codigoBuscado: string) {
    if (unsubAula) return
    unsubAula = onSnapshot(aulaRef, (snap) => {
      if (snap.exists() && snap.data()?.['codigo'] === codigoBuscado) {
        refAula = snap.ref
        segundosEspera = ((snap.data()?.['espera'] as number | undefined) ?? 5) * 60
        errorRed.value = false

        // Registrar en histórico
        const existente = historicoAulas.value.find((h) => h.codigo === codigoBuscado)
        if (!existente) {
          const entry: AulaHistorico = {
            id: aulaRef.id,
            codigo: codigoBuscado,
            etiqueta: '',
          }
          historicoAulas.value = [entry, ...historicoAulas.value]
          guardarHistorico(historicoAulas.value)
        }

        conectarListenerCola()
      } else {
        desconectarListeners()
        abandonarCola()
      }
    })
  }

  function desconectarListeners() {
    unsubAula?.()
    unsubAula = null
    unsubCola?.()
    unsubCola = null
    desconectarListenerPosicion()
  }

  // ── encolarAlumno ──────────────────────────────────────────────────────────
  function encolarAlumno(codigo: string) {
    withTimeout(10, () =>
      getDocs(
        query(
          collectionGroup(db, 'aulas'),
          where('codigo', '==', codigo),
          limit(1),
        ),
      ),
    ).then((snap) => {
      const primeraAula = snap.docs[0]
      if (primeraAula !== undefined) {
        errorRed.value = false
        conectarListenerAula(primeraAula.ref, codigo)
      } else {
        errorRed.value = false
        estadoTurno.value = { tipo: 'error', mensaje: 'Aula no encontrada' }
        actualizarUI()
      }
    }).catch(() => {
      errorRed.value = true
      estadoTurno.value = { tipo: 'error', mensaje: 'Error de conexión' }
      actualizarUI()
    })
  }

  // ── abandonarCola ──────────────────────────────────────────────────────────
  async function abandonarCola() {
    if (refPosicion) {
      try {
        await deleteDoc(refPosicion)
      } catch {
        // silencioso
      }
      refPosicion = null
    }
    router.push('/')
  }

  // ── Public actions ─────────────────────────────────────────────────────────
  function iniciar() {
    placeholder.value = nombreAleatorio()
  }

  async function conectar() {
    const codigo = codigoAula.value.toUpperCase()
    const nombre = nombreEfectivo.value

    localStorage.setItem(LS_CODIGO, codigo)
    localStorage.setItem(LS_NOMBRE, nombre)
    codigoAulaActual.value = codigo

    pedirTurno = true
    atendido = false
    encolando = false
    ultimaPeticion = null
    iniciarCarga()
    mostrarError.value = false
    errorRed.value = false
    estadoTurno.value = { tipo: 'enCola', posicion: 0 }
    reiniciarCronometro()

    router.push('/turno')

    try {
      const resultado: UserCredential = await withTimeout(10, () =>
        signInAnonymously(auth),
      )
      uid = resultado.user.uid
      actualizarAlumno(nombre)
      encolarAlumno(codigo)
    } catch {
      errorRed.value = true
      estadoTurno.value = { tipo: 'error', mensaje: 'Error de conexión' }
      actualizarUI()
    }
  }

  async function cancelar() {
    reiniciarCronometro()
    desconectarListeners()
    await abandonarCola()
  }

  function actualizar() {
    if (atendido) {
      atendido = false
      pedirTurno = true
      encolarAlumno(codigoAulaActual.value)
    }
  }

  function reintentar() {
    mostrarError.value = false
    iniciarCarga()
    desconectarListeners()

    const codigo = codigoAulaActual.value
    const nombre = nombreEfectivo.value

    if (uid !== null) {
      pedirTurno = true
      encolarAlumno(codigo)
      return
    }

    signInAnonymously(auth).then((resultado) => {
      uid = resultado.user.uid
      actualizarAlumno(nombre)
      pedirTurno = true
      encolarAlumno(codigo)
    }).catch(() => {
      terminarCarga()
    })
  }

  function actualizarEtiqueta(id: string, etiqueta: string) {
    historicoAulas.value = historicoAulas.value.map((h) =>
      h.id === id ? { ...h, etiqueta } : h,
    )
    guardarHistorico(historicoAulas.value)
  }

  function eliminarDelHistorico(id: string) {
    historicoAulas.value = historicoAulas.value.filter((h) => h.id !== id)
    guardarHistorico(historicoAulas.value)
  }

  return {
    codigoAula,
    nombreUsuario,
    placeholder,
    historicoAulas,
    mostrandoTurno,
    codigoAulaActual,
    estadoTurno,
    minutosRestantes,
    segundosRestantes,
    mostrarCronometro,
    mostrarBotonActualizar,
    mostrarError,
    cargando,
    errorRed,
    nombreEfectivo,
    puedeConectar,
    iniciar,
    conectar,
    cancelar,
    actualizar,
    reintentar,
    actualizarEtiqueta,
    eliminarDelHistorico,
  }
})

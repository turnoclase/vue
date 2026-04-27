import { defineStore } from 'pinia'
import { ref } from 'vue'
import { signInAnonymously } from 'firebase/auth'
import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type DocumentReference,
  type CollectionReference,
  type Unsubscribe,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '@/firebase'

export interface AlumnoCola {
  id: string
  alumnoId: string
  nombre: string
}

const LS_UID = 'profesorUid'
const LS_CODIGO_INVITADO = 'codigoAulaConectada'
const LS_PIN_INVITADO = 'pinConectada'

export const useAulaStore = defineStore('aula', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const codigoAula = ref('...')
  const enCola = ref(0)
  const nombreAlumno = ref('')
  const alumnosEnCola = ref<AlumnoCola[]>([])
  const numAulas = ref(0)
  const aulaActual = ref(0)
  const mostrarIndicador = ref(false)
  const invitado = ref(false)
  const PIN = ref('...')
  const etiquetaAula = ref('')
  const tiempoEspera = ref(5)
  const cargando = ref(true)
  const errorRed = ref(false)
  const reintentando = ref(false)

  // ── Internal (non-reactive) ────────────────────────────────────────────────
  let uid: string | null = localStorage.getItem(LS_UID) ?? null
  let refAula: DocumentReference | null = null
  let refMisAulas: CollectionReference | null = null
  let unsubAula: Unsubscribe | null = null
  let unsubCola: Unsubscribe | null = null
  let avanzandoCola = false
  let vaciandoCola = false
  let inicioCarga: Date = new Date(0)

  // ── Carga helpers ──────────────────────────────────────────────────────────
  function iniciarCarga() {
    inicioCarga = new Date()
    cargando.value = true
  }

  function terminarCarga() {
    const transcurrido = Date.now() - inicioCarga.getTime()
    const restante = 1000 - transcurrido
    if (restante > 0) {
      setTimeout(() => { cargando.value = false }, restante)
    } else {
      cargando.value = false
    }
  }

  // ── PIN helper ─────────────────────────────────────────────────────────────
  function randomPin(): string {
    return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  }

  // ── mostrarSiguienteDesdeSnapshot ──────────────────────────────────────────
  async function mostrarSiguienteDesdeSnapshot(docs: { data: () => Record<string, unknown> }[]) {
    if (docs.length === 0) {
      nombreAlumno.value = ''
      return
    }
    const primer = docs[0]
    if (!primer) return
    const alumnoId = primer.data()['alumno'] as string | undefined
    if (!alumnoId) return
    try {
      const alumnoDoc = await getDoc(doc(db, 'alumnos', alumnoId))
      if (alumnoDoc.exists()) {
        nombreAlumno.value = (alumnoDoc.data()['nombre'] as string | undefined) ?? ''
      }
    } catch {
      // silencioso
    }
  }

  // ── actualizarListaAlumnosEnCola ───────────────────────────────────────────
  async function actualizarListaAlumnosEnCola(docs: { id: string; data: () => Record<string, unknown> }[]) {
    const lista: AlumnoCola[] = []
    for (const d of docs) {
      const alumnoId = d.data()['alumno'] as string | undefined
      if (!alumnoId) continue
      let nombre = alumnoId
      try {
        const alumnoDoc = await getDoc(doc(db, 'alumnos', alumnoId))
        if (alumnoDoc.exists()) {
          nombre = (alumnoDoc.data()['nombre'] as string | undefined) ?? alumnoId
        }
      } catch {
        // silencioso
      }
      lista.push({ id: d.id, alumnoId, nombre })
    }
    alumnosEnCola.value = lista
  }

  // ── desconectarListeners ───────────────────────────────────────────────────
  function desconectarListeners() {
    unsubAula?.()
    unsubAula = null
    unsubCola?.()
    unsubCola = null
  }

  // ── conectarListener ──────────────────────────────────────────────────────
  function conectarListener() {
    if (!refAula) return

    const aulaRef = refAula

    unsubAula = onSnapshot(aulaRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        codigoAula.value = (data['codigo'] as string | undefined) ?? '?'
        PIN.value = (data['pin'] as string | undefined) ?? '...'
        tiempoEspera.value = (data['espera'] as number | undefined) ?? 5
        etiquetaAula.value = (data['etiqueta'] as string | undefined) ?? ''
        errorRed.value = false
        terminarCarga()
        mostrarIndicador.value = false

        // Iniciar listener de cola si no está activo
        if (!unsubCola) {
          unsubCola = onSnapshot(
            query(collection(aulaRef, 'cola'), orderBy('timestamp')),
            async (colaSnap) => {
              const docs = colaSnap.docs
              enCola.value = docs.length

              if (!vaciandoCola) {
                actualizarListaAlumnosEnCola(docs)
              }

              if (!avanzandoCola && !vaciandoCola) {
                await mostrarSiguienteDesdeSnapshot(docs)
              }
            },
            () => {
              errorRed.value = true
            },
          )
        }
      } else {
        if (!invitado.value) {
          conectarAula(aulaActual.value)
        } else {
          desconectarAula()
        }
      }
    }, () => {
      errorRed.value = true
    })
  }

  // ── crearAula ─────────────────────────────────────────────────────────────
  async function crearAula() {
    mostrarIndicador.value = true
    try {
      const nuevoCodigo = httpsCallable<unknown, { codigo: string }>(functions, 'nuevoCodigo')
      const resultado = await nuevoCodigo({})
      const codigo = resultado.data.codigo

      if (!refMisAulas) return

      const pin = randomPin()
      const nuevaAulaRef = await addDoc(refMisAulas, {
        codigo,
        timestamp: serverTimestamp(),
        pin,
        espera: 5,
        etiqueta: '',
      })

      numAulas.value++
      refAula = nuevaAulaRef
      conectarListener()
    } catch {
      errorRed.value = true
      mostrarIndicador.value = false
    }
  }

  // ── conectarAula ──────────────────────────────────────────────────────────
  async function conectarAula(posicion: number = 0) {
    if (!uid) return
    iniciarCarga()
    try {
      refMisAulas = collection(db, 'profesores', uid, 'aulas')
      const snap = await getDocs(query(refMisAulas, orderBy('timestamp')))
      const docs = snap.docs
      numAulas.value = docs.length

      desconectarListeners()

      if (posicion >= 0 && posicion < docs.length) {
        const aulaDoc = docs[posicion]
        if (aulaDoc) {
          refAula = aulaDoc.ref
          conectarListener()
        }
      } else {
        await crearAula()
      }
    } catch {
      errorRed.value = true
      cargando.value = false
    }
  }

  // ── iniciar ───────────────────────────────────────────────────────────────
  async function iniciar() {
    codigoAula.value = '...'
    nombreAlumno.value = ''
    alumnosEnCola.value = []
    enCola.value = 0
    errorRed.value = false
    cargando.value = true
    iniciarCarga()

    try {
      const resultado = await signInAnonymously(auth)
      const nuevoUid = resultado.user.uid

      const storedUid = localStorage.getItem(LS_UID)
      if (storedUid && storedUid !== nuevoUid) {
        uid = storedUid
      } else {
        uid = nuevoUid
        localStorage.setItem(LS_UID, nuevoUid)
      }

      // Recuperar modo invitado
      const codigoGuardado = localStorage.getItem(LS_CODIGO_INVITADO)
      const pinGuardado = localStorage.getItem(LS_PIN_INVITADO)
      if (codigoGuardado && pinGuardado) {
        await buscarAula(codigoGuardado, pinGuardado)
      } else {
        await conectarAula(0)
      }
    } catch {
      errorRed.value = true
      codigoAula.value = '?'
      cargando.value = false
    }
  }

  // ── anyadirAula ───────────────────────────────────────────────────────────
  async function anyadirAula() {
    if (!uid) return
    if (!refMisAulas) {
      refMisAulas = collection(db, 'profesores', uid, 'aulas')
    }
    try {
      const nuevoCodigo = httpsCallable<unknown, { codigo: string }>(functions, 'nuevoCodigo')
      const resultado = await nuevoCodigo({})
      const codigo = resultado.data.codigo

      await addDoc(refMisAulas, {
        codigo,
        timestamp: serverTimestamp(),
        pin: randomPin(),
        espera: 5,
        etiqueta: '',
      })
      numAulas.value++
    } catch {
      errorRed.value = true
    }
  }

  // ── mostrarSiguiente ──────────────────────────────────────────────────────
  async function mostrarSiguiente(avanzarCola: boolean = false) {
    if (!refAula) return
    try {
      const snap = await getDocs(query(collection(refAula, 'cola'), orderBy('timestamp')))
      const docs = snap.docs

      if (docs.length === 0) {
        nombreAlumno.value = ''
        return
      }

      if (avanzarCola) {
        avanzandoCola = true
        const primer = docs[0]
        if (!primer) return
        const alumnoId = primer.data()['alumno'] as string | undefined

        if (alumnoId) {
          await setDoc(doc(refAula, 'espera', alumnoId), { timestamp: serverTimestamp() })
        }
        await deleteDoc(primer.ref)
        avanzandoCola = false

        if (docs.length > 1) {
          const segundo = docs[1]
          if (!segundo) return
          const siguienteId = segundo.data()['alumno'] as string | undefined
          if (siguienteId) {
            try {
              const alumnoDoc = await getDoc(doc(db, 'alumnos', siguienteId))
              if (alumnoDoc.exists()) {
                nombreAlumno.value = (alumnoDoc.data()['nombre'] as string | undefined) ?? ''
              }
            } catch {
              // silencioso
            }
          }
        } else {
          nombreAlumno.value = ''
        }
      } else {
        const primer = docs[0]
        if (!primer) return
        const alumnoId = primer.data()['alumno'] as string | undefined
        if (alumnoId) {
          try {
            const alumnoDoc = await getDoc(doc(db, 'alumnos', alumnoId))
            if (alumnoDoc.exists()) {
              nombreAlumno.value = (alumnoDoc.data()['nombre'] as string | undefined) ?? ''
            }
          } catch {
            // silencioso
          }
        }
      }
    } catch {
      errorRed.value = true
    }
  }

  // ── buscarAula (modo invitado) ─────────────────────────────────────────────
  async function buscarAula(codigo: string, pin: string) {
    iniciarCarga()
    errorRed.value = false
    try {
      const snap = await getDocs(
        query(
          collectionGroup(db, 'aulas'),
          where('codigo', '==', codigo.toUpperCase()),
          where('pin', '==', pin),
        ),
      )
      if (!snap.empty) {
        localStorage.setItem(LS_CODIGO_INVITADO, codigo.toUpperCase())
        localStorage.setItem(LS_PIN_INVITADO, pin)
        invitado.value = true
        desconectarListeners()
        const primerAula = snap.docs[0]
        if (primerAula) {
          refAula = primerAula.ref
          conectarListener()
        }
      } else {
        desconectarAula()
      }
    } catch {
      errorRed.value = true
    }
  }

  // ── desconectarAula ───────────────────────────────────────────────────────
  function desconectarAula() {
    localStorage.removeItem(LS_CODIGO_INVITADO)
    localStorage.removeItem(LS_PIN_INVITADO)
    invitado.value = false
    desconectarListeners()
    conectarAula(aulaActual.value)
  }

  // ── reintentar ────────────────────────────────────────────────────────────
  async function reintentar() {
    if (reintentando.value) return
    reintentando.value = true
    desconectarListeners()
    iniciarCarga()

    try {
      if (uid !== null) {
        const codigoGuardado = localStorage.getItem(LS_CODIGO_INVITADO)
        const pinGuardado = localStorage.getItem(LS_PIN_INVITADO)
        if (codigoGuardado && pinGuardado) {
          await buscarAula(codigoGuardado, pinGuardado)
        } else {
          await conectarAula(aulaActual.value)
        }
      } else {
        const resultado = await signInAnonymously(auth)
        const nuevoUid = resultado.user.uid
        const storedUid = localStorage.getItem(LS_UID)
        if (storedUid && storedUid !== nuevoUid) {
          uid = storedUid
        } else {
          uid = nuevoUid
          localStorage.setItem(LS_UID, nuevoUid)
        }
        await conectarAula(aulaActual.value)
      }
    } catch {
      errorRed.value = true
      cargando.value = false
    } finally {
      reintentando.value = false
    }
  }

  // ── borrarAulaReconectar ──────────────────────────────────────────────────
  async function borrarAulaReconectar(codigo: string) {
    if (!uid || !refMisAulas) return
    mostrarIndicador.value = true
    desconectarListeners()
    try {
      const snap = await getDocs(query(refMisAulas, where('codigo', '==', codigo)))
      for (const d of snap.docs) {
        await deleteDoc(d.ref)
      }
      numAulas.value--
      if (aulaActual.value >= numAulas.value) {
        aulaActual.value = Math.max(0, numAulas.value - 1)
      }
      await conectarAula(aulaActual.value)
    } catch {
      errorRed.value = true
      mostrarIndicador.value = false
    }
  }

  // ── actualizarEtiqueta ────────────────────────────────────────────────────
  async function actualizarEtiqueta(etiqueta: string) {
    etiquetaAula.value = etiqueta
    if (!refAula) return
    try {
      await updateDoc(refAula, { etiqueta: etiqueta.trim() })
    } catch {
      // silencioso
    }
  }

  // ── actualizarTiempoEspera ────────────────────────────────────────────────
  async function actualizarTiempoEspera(tiempo: number) {
    tiempoEspera.value = tiempo
    if (!refAula) return
    try {
      await updateDoc(refAula, { espera: tiempo })
    } catch {
      // silencioso
    }
  }

  // ── aulaAnterior / aulaSiguiente ──────────────────────────────────────────
  function aulaAnterior() {
    if (invitado.value || numAulas.value <= 1 || aulaActual.value <= 0) return
    aulaActual.value--
    desconectarListeners()
    conectarAula(aulaActual.value)
  }

  function aulaSiguiente() {
    if (invitado.value || numAulas.value <= 1 || aulaActual.value >= numAulas.value - 1) return
    aulaActual.value++
    desconectarListeners()
    conectarAula(aulaActual.value)
  }

  // ── eliminarAlumnoDeCola ──────────────────────────────────────────────────
  async function eliminarAlumnoDeCola(alumno: AlumnoCola) {
    if (!refAula) return
    try {
      await deleteDoc(doc(collection(refAula, 'cola'), alumno.id))
    } catch {
      // silencioso
    }
  }

  // ── vaciarCola ────────────────────────────────────────────────────────────
  async function vaciarCola() {
    if (!refAula) return
    nombreAlumno.value = ''
    alumnosEnCola.value = []
    avanzandoCola = false
    vaciandoCola = true
    try {
      const snap = await getDocs(collection(refAula, 'cola'))
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
    } catch {
      // silencioso
    } finally {
      vaciandoCola = false
    }
  }

  return {
    codigoAula,
    enCola,
    nombreAlumno,
    alumnosEnCola,
    numAulas,
    aulaActual,
    mostrarIndicador,
    invitado,
    PIN,
    etiquetaAula,
    tiempoEspera,
    cargando,
    errorRed,
    reintentando,
    iniciar,
    conectarAula,
    crearAula,
    anyadirAula,
    mostrarSiguiente,
    buscarAula,
    desconectarAula,
    reintentar,
    borrarAulaReconectar,
    actualizarEtiqueta,
    actualizarTiempoEspera,
    aulaAnterior,
    aulaSiguiente,
    eliminarAlumnoDeCola,
    vaciarCola,
  }
})

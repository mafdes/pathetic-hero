/**
 * classes.js — Base de datos oficial de Clases por Escalones (Tiers)
 * Clases puramente narrativas y cómicas. CERO bonus mecánicos.
 */

export const CLASS_TIERS = [
  {
    tier: 1,
    title: "Escalón I: Las Leyendas del Gremio",
    subtitle: "Clases reservadas para héroes de leyenda. Requisitos desorbitados que casi nadie cumple.",
    giveUpText: "Rendirse y mirar Clases Inferiores",
    classes: [
      {
        id: "knight",
        name: "Caballero Real",
        reqText: "Fuerza >= 14 | Constitución >= 13",
        requirements: { strength: 14, constitution: 13 },
        description: "Portador de armadura de plomo reluciente y defensor del honor administrativo.",
        rejection: "El Tribunal estampa el rechazo: 'Firmeza física insuficiente para soportar el peto de plomo sin doblarse por la cintura'.",
      },
      {
        id: "archmage",
        name: "Archimago Supremo",
        reqText: "Inteligencia >= 15",
        requirements: { intelligence: 15 },
        description: "Dominador de las artes oscuras, del fuego estelar y de la memoria sin límites.",
        rejection: "El Tribunal estampa el rechazo: 'Cerebro con masa crítica insuficiente. Tropezó con el pergamino de bienvenida'.",
      },
      {
        id: "barbarian",
        name: "Bárbaro de las Estepas",
        reqText: "Fuerza >= 15 | Constitución >= 14",
        requirements: { strength: 15, constitution: 14 },
        description: "Aplastador de rocas y devorador de jabalíes crudos en medio de la ventisca.",
        rejection: "El Tribunal estampa el rechazo: 'Espalda de juncos secos. El hacha doble le partiría la columna al levantarla'.",
      },
      {
        id: "rogue",
        name: "Pícaro Sombrío",
        reqText: "Destreza >= 14 | Agilidad >= 14",
        requirements: { dexterity: 14, agility: 14 },
        description: "Fantasma nocturno capaz de vaciar bolsillos ajenos sin alterar el aire.",
        rejection: "El Tribunal estampa el rechazo: 'Sigilo nulo. Sus botas chirrían sobre la alfombra como dos cerdos asustados'.",
      },
      {
        id: "paladin",
        name: "Paladín Sagrado",
        reqText: "Fuerza >= 13 | Constitución >= 13 | Inteligencia >= 12",
        requirements: { strength: 13, constitution: 13, intelligence: 12 },
        description: "Faro de fe inviolable, devoción de hierro y sabiduría celestial.",
        rejection: "El Tribunal estampa el rechazo: 'La luz divina le ciega y se confunde de puerta al salir del confesionario'.",
      }
    ]
  },
  {
    tier: 2,
    title: "Escalón II: Los Aspirantes del Gremio",
    subtitle: "Estudiantes y auxiliares. Requisitos moderados pero que el tribunal sigue considerando excesivos para ti.",
    giveUpText: "Reconocer incapacidad y bajar de escalón",
    classes: [
      {
        id: "mage_apprentice",
        name: "Aprendiz de Mago",
        reqText: "Inteligencia >= 10",
        requirements: { intelligence: 10 },
        description: "Encargado de barrer el polvo de las túnicas y encender las velas de la biblioteca.",
        rejection: "El Archivista niega con la cabeza: 'Confunde las palabras de los hechizos con recetas de sopa de col'.",
      },
      {
        id: "squire",
        name: "Escudero de Guardia",
        reqText: "Fuerza >= 9 | Constitución >= 9",
        requirements: { strength: 9, constitution: 9 },
        description: "Pulidor oficial de hebillas y cargador del saco de avena de la caballería.",
        rejection: "El Instructor se burla: 'No aguantaría tres pasos cargando el peto de repuesto'.",
      },
      {
        id: "pickpocket",
        name: "Ratero de Callejón",
        reqText: "Destreza >= 9 | Agilidad >= 9",
        requirements: { dexterity: 9, agility: 9 },
        description: "Especialista en hurgar en sacos abiertos y huir despavorido ante la guardia.",
        rejection: "El Tribunal anota: 'Torpeza de dedos. Logró meterse la mano en su propio bolsillo por accidente'.",
      },
      {
        id: "torchbearer",
        name: "Portador de Antorchas",
        reqText: "Constitución >= 8",
        requirements: { constitution: 8 },
        description: "El primero en entrar en la mazmorra oscura y el último en ser recordado.",
        rejection: "El Capitán sentencia: 'Se le apaga la antorcha con su propio aliento agitado'.",
      }
    ]
  },
  {
    tier: 3,
    title: "Escalón III: Oficios Comunes del Reino",
    subtitle: "Puestos del día a día. El gremio tampoco cree que tengas la compostura necesaria.",
    giveUpText: "Descender a las clases absurdas finales",
    classes: [
      {
        id: "peasant",
        name: "Campesino con Azadón",
        reqText: "Fuerza >= 7",
        requirements: { strength: 7 },
        description: "Cultivador de nabos y espectador profesional del paso de caballeros verdaderos.",
        rejection: "El Examinador suspira: 'Los nabos se le darían mejor que las armas, pero ni para eso hay agarre'.",
      },
      {
        id: "latrine_cleaner",
        name: "Limpiador de Letrinas",
        reqText: "Constitución >= 7",
        requirements: { constitution: 7 },
        description: "Héroe anónimo del alcantarillado del gremio. Su estómago es legendario.",
        rejection: "El Gremio rechaza la solicitud: 'Mareos prematuros al acercarse al foso del establo'.",
      },
      {
        id: "gate_guard",
        name: "Guardia Sentado de Puerta",
        reqText: "Constitución >= 6",
        requirements: { constitution: 6 },
        description: "Encargado de pedir el salvoconducto y dormitar al sol sobre un taburete.",
        rejection: "El Oficial anota: 'Se cae del taburete antes del segundo ronquido'.",
      },
      {
        id: "potato_peeler",
        name: "Pelador de Patatas",
        reqText: "Destreza >= 6",
        requirements: { dexterity: 6 },
        description: "Pilar fundamental de las sopas de la cocina del gremio.",
        rejection: "El Cocinero Jefe le echa: 'Corta más piel de sus dedos que de las patatas'.",
      }
    ]
  },
  {
    tier: 4,
    title: "Escalón IV: Clases Absurdas y Desesperadas (¡ASIGNACIÓN FINAL!)",
    subtitle: "Sin requisitos. El gremio ha tirado la toalla y te concede una de estas identidades de consolación.",
    giveUpText: null,
    classes: [
      {
        id: "lucky_leper",
        name: "Leproso Afortunado",
        reqText: "Aceptación Inmediata",
        requirements: {},
        description: "Nadie se le acerca demasiado por precaución. La suerte le sonríe donde la salud le falló.",
        rejection: null,
      },
      {
        id: "mystic_limper",
        name: "Cojo Místico",
        reqText: "Aceptación Inmediata",
        requirements: {},
        description: "Avanza despacio y tropezando con estilo. Su andar errático confunde a los monstruos.",
        rejection: null,
      },
      {
        id: "one_eyed_bard",
        name: "Tavernero Tuerto",
        reqText: "Aceptación Inmediata",
        requirements: {},
        description: "No ve venir los hachazos, pero sus gritos de dolor asustan a los roedores.",
        rejection: null,
      },
      {
        id: "barrel_survivor",
        name: "Superviviente de Barriles",
        reqText: "Aceptación Inmediata",
        requirements: {},
        description: "Ha esquivado y recibido tantos toneles que su cuerpo vive en alerta permanente.",
        rejection: null,
      },
      {
        id: "ghost_bureaucrat",
        name: "Fantasma Administrativo",
        reqText: "Aceptación Inmediata",
        requirements: {},
        description: "Nadie sabe si sigue con vida o si solo olvidaron borrar su sello de la lista de espera.",
        rejection: null,
      }
    ]
  }
];

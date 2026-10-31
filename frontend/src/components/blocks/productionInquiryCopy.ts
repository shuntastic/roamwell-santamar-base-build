import { isLocale, type Locale } from '@/lib/i18n';

export const PRODUCTION_TYPES = [
  'commercial',
  'editorial',
  'film_tv',
  'corporate',
  'music_video',
  'other',
] as const;

export const FORMATS = ['still', 'motion', 'both'] as const;

export type ProductionType = (typeof PRODUCTION_TYPES)[number];
export type ProductionFormat = (typeof FORMATS)[number];

export const INQUIRY_FIELDS = [
  'name',
  'company',
  'email',
  'phone',
  'projectBrand',
  'productionType',
  'productionTypeOther',
  'format',
  'shootDateStart',
  'shootDateEnd',
  'prepStrikeDateStart',
  'prepStrikeDateEnd',
  'crewSize',
  'hoursNeeded',
  'vehicleCount',
  'details',
] as const;

export type InquiryField = (typeof INQUIRY_FIELDS)[number];

/** Matches the error codes returned by the CMS `production-inquiries/submit` endpoint. */
export type InquiryErrorCode = 'required' | 'invalid' | 'tooLong' | 'outOfRange' | 'beforeStart';

export type InquiryCopy = {
  title: string;
  submit: string;
  submitting: string;
  success: string;
  successHeading: string;
  sendAnother: string;
  requiredNote: string;
  groups: {
    contact: string;
    production: string;
    schedule: string;
    logistics: string;
  };
  labels: Record<InquiryField, string> & {
    shootDates: string;
    prepStrikeDates: string;
  };
  hints: {
    endDate: string;
    details: string;
  };
  productionTypes: Record<ProductionType, string>;
  formats: Record<ProductionFormat, string>;
  errors: {
    required: string;
    choose: string;
    email: string;
    phone: string;
    date: string;
    wholeNumber: string;
    number: string;
    tooLong: string;
    outOfRange: string;
    beforeStart: string;
  };
  summary: (count: number) => string;
  rateLimited: string;
  unavailable: string;
  failed: string;
};

const en: InquiryCopy = {
  title: 'Check Availability',
  submit: 'Check Availability',
  submitting: 'Sending…',
  success: 'Thank you. Our production team will be in touch shortly.',
  successHeading: 'Inquiry sent',
  sendAnother: 'Send another inquiry',
  requiredNote: 'Fields marked * are required.',
  groups: {
    contact: 'Contact',
    production: 'Production',
    schedule: 'Schedule',
    logistics: 'Crew & logistics',
  },
  labels: {
    name: 'Name',
    company: 'Company / Production Company',
    email: 'Email',
    phone: 'Phone',
    projectBrand: 'Project / Brand',
    productionType: 'Production Type',
    productionTypeOther: 'Please specify',
    format: 'Format',
    shootDates: 'Shoot Date(s)',
    shootDateStart: 'Start date',
    shootDateEnd: 'End date',
    prepStrikeDates: 'Prep / Strike Date(s)',
    prepStrikeDateStart: 'Start date',
    prepStrikeDateEnd: 'End date',
    crewSize: 'Crew Size',
    hoursNeeded: 'Hours Needed',
    vehicleCount: 'Estimated number of vehicles',
    details: 'Additional Production Details / Special Requirements',
  },
  hints: {
    endDate: 'Leave blank for a single day',
    details: 'Access, power, parking, equipment, or anything else we should know.',
  },
  productionTypes: {
    commercial: 'Commercial',
    editorial: 'Editorial',
    film_tv: 'Film & TV',
    corporate: 'Corporate',
    music_video: 'Music Video',
    other: 'Other',
  },
  formats: { still: 'Still', motion: 'Motion', both: 'Both' },
  errors: {
    required: 'This field is required.',
    choose: 'Please choose an option.',
    email: 'Enter a valid email address, like name@example.com.',
    phone: 'Enter a valid phone number.',
    date: 'Enter a valid date.',
    wholeNumber: 'Enter a whole number.',
    number: 'Enter a number.',
    tooLong: 'This entry is too long.',
    outOfRange: 'Enter a value within a realistic range.',
    beforeStart: 'End date can’t be before the start date.',
  },
  summary: (count) =>
    count === 1
      ? 'Please correct the highlighted field.'
      : `Please correct the ${count} highlighted fields.`,
  rateLimited: 'You’ve sent several inquiries recently. Please wait a few minutes and try again.',
  unavailable: 'This form is not accepting submissions right now. Please contact us directly.',
  failed: 'We couldn’t send your inquiry. Please check your connection and try again.',
};

const es: InquiryCopy = {
  title: 'Consultar disponibilidad',
  submit: 'Enviar solicitud',
  submitting: 'Enviando…',
  success: 'Gracias. Nuestro equipo de producción se pondrá en contacto pronto.',
  successHeading: 'Solicitud enviada',
  sendAnother: 'Enviar otra solicitud',
  requiredNote: 'Los campos marcados con * son obligatorios.',
  groups: {
    contact: 'Contacto',
    production: 'Producción',
    schedule: 'Calendario',
    logistics: 'Equipo y logística',
  },
  labels: {
    name: 'Nombre',
    company: 'Empresa / Productora',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    projectBrand: 'Proyecto / Marca',
    productionType: 'Tipo de producción',
    productionTypeOther: 'Especifique',
    format: 'Formato',
    shootDates: 'Fecha(s) de rodaje',
    shootDateStart: 'Fecha de inicio',
    shootDateEnd: 'Fecha de fin',
    prepStrikeDates: 'Fecha(s) de montaje / desmontaje',
    prepStrikeDateStart: 'Fecha de inicio',
    prepStrikeDateEnd: 'Fecha de fin',
    crewSize: 'Tamaño del equipo',
    hoursNeeded: 'Horas necesarias',
    vehicleCount: 'Número estimado de vehículos',
    details: 'Detalles adicionales de producción / Requisitos especiales',
  },
  hints: {
    endDate: 'Déjelo en blanco si es un solo día',
    details: 'Acceso, electricidad, estacionamiento, equipo o cualquier otra información útil.',
  },
  productionTypes: {
    commercial: 'Publicidad',
    editorial: 'Editorial',
    film_tv: 'Cine y TV',
    corporate: 'Corporativo',
    music_video: 'Videoclip',
    other: 'Otro',
  },
  formats: { still: 'Fotografía', motion: 'Video', both: 'Ambos' },
  errors: {
    required: 'Este campo es obligatorio.',
    choose: 'Seleccione una opción.',
    email: 'Introduzca un correo válido, por ejemplo nombre@ejemplo.com.',
    phone: 'Introduzca un número de teléfono válido.',
    date: 'Introduzca una fecha válida.',
    wholeNumber: 'Introduzca un número entero.',
    number: 'Introduzca un número.',
    tooLong: 'El texto es demasiado largo.',
    outOfRange: 'Introduzca un valor dentro de un rango realista.',
    beforeStart: 'La fecha de fin no puede ser anterior a la de inicio.',
  },
  summary: (count) =>
    count === 1 ? 'Corrija el campo resaltado.' : `Corrija los ${count} campos resaltados.`,
  rateLimited: 'Ha enviado varias solicitudes recientemente. Espere unos minutos e inténtelo de nuevo.',
  unavailable: 'Este formulario no acepta envíos en este momento. Contáctenos directamente.',
  failed: 'No pudimos enviar su solicitud. Revise su conexión e inténtelo de nuevo.',
};

const pt: InquiryCopy = {
  title: 'Verificar disponibilidade',
  submit: 'Enviar solicitação',
  submitting: 'Enviando…',
  success: 'Obrigado. Nossa equipe de produção entrará em contato em breve.',
  successHeading: 'Solicitação enviada',
  sendAnother: 'Enviar outra solicitação',
  requiredNote: 'Campos marcados com * são obrigatórios.',
  groups: {
    contact: 'Contato',
    production: 'Produção',
    schedule: 'Cronograma',
    logistics: 'Equipe e logística',
  },
  labels: {
    name: 'Nome',
    company: 'Empresa / Produtora',
    email: 'E-mail',
    phone: 'Telefone',
    projectBrand: 'Projeto / Marca',
    productionType: 'Tipo de produção',
    productionTypeOther: 'Especifique',
    format: 'Formato',
    shootDates: 'Data(s) de filmagem',
    shootDateStart: 'Data de início',
    shootDateEnd: 'Data de término',
    prepStrikeDates: 'Data(s) de montagem / desmontagem',
    prepStrikeDateStart: 'Data de início',
    prepStrikeDateEnd: 'Data de término',
    crewSize: 'Tamanho da equipe',
    hoursNeeded: 'Horas necessárias',
    vehicleCount: 'Número estimado de veículos',
    details: 'Detalhes adicionais da produção / Requisitos especiais',
  },
  hints: {
    endDate: 'Deixe em branco se for um único dia',
    details: 'Acesso, energia, estacionamento, equipamentos ou qualquer outra informação útil.',
  },
  productionTypes: {
    commercial: 'Publicidade',
    editorial: 'Editorial',
    film_tv: 'Cinema e TV',
    corporate: 'Corporativo',
    music_video: 'Videoclipe',
    other: 'Outro',
  },
  formats: { still: 'Foto', motion: 'Vídeo', both: 'Ambos' },
  errors: {
    required: 'Este campo é obrigatório.',
    choose: 'Selecione uma opção.',
    email: 'Informe um e-mail válido, por exemplo nome@exemplo.com.',
    phone: 'Informe um telefone válido.',
    date: 'Informe uma data válida.',
    wholeNumber: 'Informe um número inteiro.',
    number: 'Informe um número.',
    tooLong: 'O texto é muito longo.',
    outOfRange: 'Informe um valor dentro de um intervalo realista.',
    beforeStart: 'A data de término não pode ser anterior à data de início.',
  },
  summary: (count) =>
    count === 1 ? 'Corrija o campo destacado.' : `Corrija os ${count} campos destacados.`,
  rateLimited: 'Você enviou várias solicitações recentemente. Aguarde alguns minutos e tente novamente.',
  unavailable: 'Este formulário não está aceitando envios no momento. Entre em contato diretamente.',
  failed: 'Não foi possível enviar sua solicitação. Verifique sua conexão e tente novamente.',
};

const COPY: Record<Locale, InquiryCopy> = { en, es, pt };

export function getInquiryCopy(locale: string): InquiryCopy {
  return COPY[isLocale(locale) ? locale : 'en'];
}

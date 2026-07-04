interface Contact {
  username: string;
  online: boolean;
}

interface Message {
  id?: number;
  contact: string;
  content: string;
  time: string;
  isSelf: boolean;
  status?: 'sent' | 'failed';
}

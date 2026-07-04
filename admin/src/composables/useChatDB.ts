import Dexie, { type Table } from 'dexie';

class ChatDB extends Dexie {
  messages!: Table<Message, number>;

  constructor() {
    super('chatDB');
    this.version(1).stores({
      messages: '++id, contact, time',
    });
  }
}

const db = new ChatDB();

export function useChatDB() {
  const getMessages = (contact: string): Promise<Message[]> =>
    db.messages.where('contact').equals(contact).sortBy('id');

  const saveMessage = (msg: Message): Promise<number> =>
    db.messages.add(msg);

  const updateMessageStatus = (id: number, status: 'sent' | 'failed') =>
    db.messages.update(id, { status });

  return { getMessages, saveMessage, updateMessageStatus };
}

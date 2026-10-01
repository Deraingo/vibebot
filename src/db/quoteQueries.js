import { getPool } from "./index.js"
const UNIQUE_VIOLATION="23505"
const MAX_INSERT_ATTEMPTS = 3;

export async function addQuote(channelId, quoteText, addedBy){
    const sql = `INSERT INTO Quotes (channel_id, quote_number, quote_text, added_by)
                    SELECT $1 COALESCE(MAX(quote_number), 0) +1, $2, $3
                    FROM quotes WHERE channel_id=$1
                    RETURNING quote_number;
                `;
    for (let attempt = 1; attempt <= MAX_INSERT_ATTEMPTS; attempt++){
        try {
            const {rows} = await getPool().query(sql, [channelId, quoteText, addedBy]);
            return rows[0].quote_number
        } catch (error) {
            if (error.code !== UNIQUE_VIOLATION || attempt === MAX_INSERT_ATTEMPTS) throw error;
        }
    }
}

export async function getQuoteByNumber(channelId, quoteNumber) {
  const { rows } = await getPool().query(
    "SELECT * FROM quotes WHERE channel_id = $1 AND quote_number = $2",
    [channelId, quoteNumber]
  );
  return rows[0] ?? null;
}

export async function getRandomQuote(channelId) {
  const { rows } = await getPool().query(
    "SELECT * FROM quotes WHERE channel_id = $1 ORDER BY random() LIMIT 1",
    [channelId]
  );
  return rows[0] ?? null;
}
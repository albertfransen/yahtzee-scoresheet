import { useState, useCallback } from "react";
import "./App.css";

const MAX_PLAYERS = 4;

const UPPER = [
  { key: "ones",   label: "Enen",    desc: "Som van alle 1-en" },
  { key: "twos",   label: "Tweeën",  desc: "Som van alle 2-en" },
  { key: "threes", label: "Drieën",  desc: "Som van alle 3-en" },
  { key: "fours",  label: "Vieren",  desc: "Som van alle 4-en" },
  { key: "fives",  label: "Vijven",  desc: "Som van alle 5-en" },
  { key: "sixes",  label: "Zessen",  desc: "Som van alle 6-en" },
];

const LOWER = [
  { key: "threeOfAKind", label: "Drie dezelfden",  desc: "Som van alle dobbelstenen" },
  { key: "fourOfAKind",  label: "Vier dezelfden",  desc: "Som van alle dobbelstenen" },
  { key: "fullHouse",    label: "Full House",       desc: "25 punten", fixed: 25 },
  { key: "smStraight",   label: "Kleine Straat",    desc: "30 punten", fixed: 30 },
  { key: "lgStraight",   label: "Grote Straat",     desc: "40 punten", fixed: 40 },
  { key: "yahtzee",      label: "Yahtzee",          desc: "50 punten", fixed: 50 },
  { key: "chance",       label: "Kans",             desc: "Som van alle dobbelstenen" },
];

const UPPER_BONUS_THRESHOLD = 63;
const UPPER_BONUS = 35;

function emptyScores() {
  const scores = {};
  [...UPPER, ...LOWER].forEach(({ key }) => (scores[key] = ""));
  scores.yahtzeeBonusCount = 0;
  return scores;
}

function calcUpperTotal(scores) {
  return UPPER.reduce((sum, { key }) => sum + (parseInt(scores[key]) || 0), 0);
}

function calcUpperBonus(scores) {
  return calcUpperTotal(scores) >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS : 0;
}

function calcLowerTotal(scores) {
  const base = LOWER.reduce((sum, { key }) => sum + (parseInt(scores[key]) || 0), 0);
  const bonus = (scores.yahtzeeBonusCount || 0) * 100;
  return base + bonus;
}

function calcGrandTotal(scores) {
  return calcUpperTotal(scores) + calcUpperBonus(scores) + calcLowerTotal(scores);
}

function ScoreInput({ value, onChange, readOnly }) {
  return (
    <input
      type="number"
      min="0"
      max="999"
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      className={`score-input ${readOnly ? "readonly" : ""} ${value !== "" ? "filled" : ""}`}
    />
  );
}

function TotalCell({ value }) {
  return <div className="total-cell">{value}</div>;
}

export default function App() {
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(["Speler 1", "Speler 2", "Speler 3", "Speler 4"]);
  const [scores, setScores] = useState(() => Array.from({ length: MAX_PLAYERS }, emptyScores));

  const updateScore = useCallback((playerIdx, key, val) => {
    setScores((prev) => {
      const next = prev.map((s) => ({ ...s }));
      next[playerIdx][key] = val;
      return next;
    });
  }, []);

  const updateName = (idx, name) => {
    setPlayerNames((prev) => {
      const next = [...prev];
      next[idx] = name;
      return next;
    });
  };

  const newGame = () => {
    setScores(Array.from({ length: MAX_PLAYERS }, emptyScores));
  };

  const checkAllFilled = (sc) => {
    const keys = [...UPPER.map((r) => r.key), ...LOWER.map((r) => r.key)];
    return keys.every((k) => sc[k] !== "");
  };

  const allDone = scores.slice(0, numPlayers).every(checkAllFilled);
  const totals = scores.slice(0, numPlayers).map(calcGrandTotal);
  const maxScore = Math.max(...totals);
  const winnerIdx = allDone ? totals.indexOf(maxScore) : -1;

  return (
    <div className="app">
      <header>
        <h1>🎲 Yahtzee Scoreblad</h1>
        <div className="controls">
          <label>
            Aantal spelers:
            <select value={numPlayers} onChange={(e) => setNumPlayers(Number(e.target.value))}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button className="btn-new-game" onClick={newGame}>Nieuw Spel</button>
        </div>
      </header>

      {allDone && (
        <div className="winner-banner">
          🏆 {playerNames[winnerIdx]} wint met {maxScore} punten!
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="label-col">Categorie</th>
              {Array.from({ length: numPlayers }, (_, i) => (
                <th key={i}>
                  <input
                    className="name-input"
                    value={playerNames[i]}
                    onChange={(e) => updateName(i, e.target.value)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="section-header">
              <td colSpan={numPlayers + 1}>Bovenvak</td>
            </tr>
            {UPPER.map(({ key, label, desc }) => (
              <tr key={key}>
                <td className="label-col" title={desc}>{label}</td>
                {Array.from({ length: numPlayers }, (_, i) => (
                  <td key={i}>
                    <ScoreInput value={scores[i][key]} onChange={(v) => updateScore(i, key, v)} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="subtotal-row">
              <td className="label-col">Bovenvak totaal</td>
              {Array.from({ length: numPlayers }, (_, i) => (
                <td key={i}><TotalCell value={calcUpperTotal(scores[i])} /></td>
              ))}
            </tr>
            <tr className="subtotal-row bonus-row">
              <td className="label-col" title={`+${UPPER_BONUS} bij ≥ ${UPPER_BONUS_THRESHOLD} punten`}>
                Bonus (+{UPPER_BONUS})
              </td>
              {Array.from({ length: numPlayers }, (_, i) => (
                <td key={i}>
                  <TotalCell value={calcUpperBonus(scores[i]) > 0 ? `✓ +${UPPER_BONUS}` : `${calcUpperTotal(scores[i])}/${UPPER_BONUS_THRESHOLD}`} />
                </td>
              ))}
            </tr>
            <tr className="section-header">
              <td colSpan={numPlayers + 1}>Ondervak</td>
            </tr>
            {LOWER.map(({ key, label, desc, fixed }) => (
              <tr key={key}>
                <td className="label-col" title={desc}>{label}</td>
                {Array.from({ length: numPlayers }, (_, i) => (
                  <td key={i}>
                    <ScoreInput
                      value={scores[i][key]}
                      onChange={() => {
                        if (fixed !== undefined) {
                          updateScore(i, key, scores[i][key] === "" ? fixed : "");
                        }
                      }}
                      readOnly={fixed !== undefined}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="label-col" title="100 punten per extra Yahtzee">Yahtzee Bonus</td>
              {Array.from({ length: numPlayers }, (_, i) => (
                <td key={i}>
                  <div className="yahtzee-bonus">
                    <button className="bonus-btn" onClick={() => updateScore(i, "yahtzeeBonusCount", Math.max(0, (scores[i].yahtzeeBonusCount || 0) - 1))}>−</button>
                    <span>{(scores[i].yahtzeeBonusCount || 0) * 100}</span>
                    <button className="bonus-btn" onClick={() => updateScore(i, "yahtzeeBonusCount", (scores[i].yahtzeeBonusCount || 0) + 1)}>+</button>
                  </div>
                </td>
              ))}
            </tr>
            <tr className="subtotal-row">
              <td className="label-col">Ondervak totaal</td>
              {Array.from({ length: numPlayers }, (_, i) => (
                <td key={i}><TotalCell value={calcLowerTotal(scores[i])} /></td>
              ))}
            </tr>
            <tr className="grand-total-row">
              <td className="label-col">Eindtotaal</td>
              {Array.from({ length: numPlayers }, (_, i) => (
                <td key={i}><TotalCell value={calcGrandTotal(scores[i])} /></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="hint">Tip: klik op Full House, Kleine Straat, Grote Straat of Yahtzee om de vaste score in/uit te vullen.</p>
    </div>
  );
}

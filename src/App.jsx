import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * CITY SIGNAL - single-file React MVP
 *
 * Features:
 * - ASCII map zones
 * - Keyboard + touch controls
 * - Core phase signals, milestone signals, behavior signals, rare signals, and sequences
 * - Signal log and pause/menu screens
 * - Local save via localStorage
 *
 * Drop into a React app (Vite recommended) as App.jsx and run.
 */

const STORAGE_KEY = "city-signal-save-v1";

const TILE = {
  WALL: "#",
  FLOOR: ".",
  START: "@",
  SIGNAL: "S",
  CLUE: "?",
  DOOR: "D",
};

const PHASE_THRESHOLDS = {
  1: { minSignals: 0, minSequenceFragments: 0 },
  2: { minSignals: 12, minSequenceFragments: 0 },
  3: { minSignals: 30, minSequenceFragments: 0 },
  4: { minSignals: 55, minSequenceFragments: 2 },
};

const MILESTONES = [
  { id: "milestone_1", atSignals: 1, text: "THE CITY IS LISTENING" },
  { id: "milestone_5", atSignals: 5, text: "LOOK UNDER THE STATIC" },
  { id: "milestone_12", atSignals: 12, text: "IT HAS STARTED TO NOTICE YOU" },
  { id: "milestone_30", atSignals: 30, text: "YOU ARE NO LONGER UNSEEN" },
  {
    id: "milestone_55",
    atSignals: 55,
    minSequenceFragments: 2,
    text: "THIS IS NOT THE ONLY CITY",
  },
];

const ZONES = [
  {
    id: "east_district",
    name: "East District",
    tags: ["light", "static", "surface", "early"],
    map: [
      "###############",
      "#@...#....S...#",
      "#....#........#",
      "#....####..?..#",
      "#......S......#",
      "#...D.........#",
      "###############",
    ],
  },
  {
    id: "signal_yard",
    name: "Signal Yard",
    tags: ["signal", "noise", "distortion", "transmission"],
    map: [
      "#################",
      "#@....S.....#...#",
      "#..####......#..#",
      "#......?......S.#",
      "#..#........#...#",
      "#..#....D...#...#",
      "#################",
    ],
  },
  {
    id: "flood_tunnels",
    name: "Flood Tunnels",
    tags: ["water", "below", "echo", "buried"],
    map: [
      "#################",
      "#@....#...S.....#",
      "#..##.#.........#",
      "#..S..#..?..##..#",
      "#......#........#",
      "#..D...#.....S..#",
      "#################",
    ],
  },
  {
    id: "glass_block",
    name: "Glass Block",
    tags: ["reflection", "duplication", "split", "mirror"],
    map: [
      "#################",
      "#@....S.....#...#",
      "#..###......#...#",
      "#.....?..S......#",
      "#..#........###.#",
      "#..#....D.......#",
      "#################",
    ],
  },
  {
    id: "underlight",
    name: "Underlight",
    tags: ["memory", "archive", "hidden", "depth"],
    map: [
      "#################",
      "#@....#...S.....#",
      "#..##.#.........#",
      "#..S..#..?..##..#",
      "#......#...S....#",
      "#..D...#........#",
      "#################",
    ],
  },
];

const PHASE_SIGNALS = {
  1: [
    ["p1_1", "THE CITY IS LISTENING", ["city", "listening", "static"]],
    ["p1_2", "LOOK UNDER THE STATIC", ["static", "hidden"]],
    ["p1_3", "LIGHTS FLICKER FOR A REASON", ["light"]],
    ["p1_4", "SOMETHING CHANGED LAST NIGHT", ["night"]],
    ["p1_5", "THERE IS A HUM BENEATH THE STREET", ["below", "signal"]],
    ["p1_6", "NOT EVERY WINDOW IS EMPTY", ["surface", "light"]],
    ["p1_7", "THE SIGNAL CAME FROM BELOW", ["below", "signal"]],
    ["p1_8", "SOME STREETS STAY AWAKE", ["surface", "night"]],
    ["p1_9", "THIS PLACE REMEMBERS THE DARK", ["memory", "night"]],
    ["p1_10", "THE AIR FEELS THINNER HERE", ["thin", "surface"]],
    ["p1_11", "SOME LIGHTS NEVER TURN OFF", ["light"]],
    ["p1_12", "THE CITY BREATHES IN WAVES", ["city", "signal"]],
    ["p1_13", "YOU CAN HEAR IT BETWEEN TRAFFIC", ["signal", "surface"]],
    ["p1_14", "SOMETHING MOVED UNDER THE GRID", ["below", "grid"]],
    ["p1_15", "THE STATIC HIDES A SECOND VOICE", ["static", "signal"]],
    ["p1_16", "THE NIGHT PRESSES CLOSE HERE", ["night"]],
    ["p1_17", "SOMEWHERE BELOW, SOMETHING ANSWERED", ["below", "echo"]],
    ["p1_18", "THE BUILDINGS KEEP THEIR OWN TIME", ["city"]],
    ["p1_19", "THE SIGNAL ARRIVED TOO EARLY", ["signal", "early"]],
    ["p1_20", "THE STREETLIGHTS MISSED A BEAT", ["light"]],
    ["p1_21", "THERE IS ANOTHER RHYTHM UNDER THIS ONE", ["below", "signal"]],
    ["p1_22", "EVEN THE SILENCE IS WIRED", ["signal", "noise"]],
    ["p1_23", "THE PAVEMENT HOLDS ITS HEAT TOO LONG", ["surface"]],
    ["p1_24", "SOME CORNERS FEEL USED TWICE", ["memory", "split"]],
    ["p1_25", "THERE IS A STREET BELOW THIS STREET", ["below"]],
    ["p1_26", "SOMETHING OLD IS STILL RUNNING", ["signal", "memory"]],
    ["p1_27", "THE CITY SPEAKS SOFTLY AT FIRST", ["city"]],
    ["p1_28", "THE GRID IS NOT ASLEEP", ["grid", "night"]],
    ["p1_29", "SOME DOORS HUM WHEN NO ONE IS THERE", ["signal"]],
    ["p1_30", "THE SHADOWS ARE SLIGHTLY OUT OF PLACE", ["split", "night"]],
  ].map(([id, text, tags]) => ({ id, text, tags })),
  2: [
    ["p2_1", "YOU WALKED PAST IT", ["recognition"]],
    ["p2_2", "YOU ALWAYS RETURN HERE", ["memory"]],
    ["p2_3", "THIS PATH REMEMBERS YOU", ["memory"]],
    ["p2_4", "IT NOTICED YOU STOPPING", ["watching"]],
    ["p2_5", "YOU MISSED THE FIRST SIGN", ["signal"]],
    ["p2_6", "YOU HAVE TAKEN THIS TURN BEFORE", ["memory"]],
    ["p2_7", "IT GREW LOUDER WHEN YOU ARRIVED", ["signal"]],
    ["p2_8", "SOMETHING WAITED FOR YOU HERE", ["watching"]],
    ["p2_9", "THIS CORNER KEPT YOUR SHAPE", ["memory"]],
    ["p2_10", "YOU WERE EXPECTED SOONER", ["watching"]],
    ["p2_11", "THE SIGNAL FOLLOWED YOUR STEPS", ["signal"]],
    ["p2_12", "YOU LEFT SOMETHING BEHIND", ["memory"]],
    ["p2_13", "IT REMEMBERS THE WAY YOU MOVE", ["memory"]],
    ["p2_14", "YOU HAVE BEEN HERE IN ANOTHER ORDER", ["split"]],
    ["p2_15", "THIS PLACE KNOWS YOUR TIMING", ["watching"]],
    ["p2_16", "IT WATCHES THE WAY YOU HESITATE", ["watching"]],
    ["p2_17", "THE STREET RECOGNIZED YOU", ["city"]],
    ["p2_18", "YOU CAME BACK TOO EASILY", ["memory"]],
    ["p2_19", "THIS IS WHERE IT FIRST SAW YOU", ["watching"]],
    ["p2_20", "YOUR FOOTSTEPS MATCH AN OLDER PATTERN", ["memory"]],
    ["p2_21", "THE SIGNAL STRENGTHENED WHEN YOU TURNED BACK", ["signal"]],
    ["p2_22", "YOU CHOSE THE SAME WAY AGAIN", ["memory"]],
    ["p2_23", "SOMETHING HERE KNOWS YOUR ROUTE", ["watching"]],
    ["p2_24", "IT HAS STARTED TO NOTICE YOU", ["watching"]],
    ["p2_25", "YOU ARE LEAVING A TRACE", ["memory"]],
    ["p2_26", "THE GRID IS LEARNING YOUR HABITS", ["grid"]],
    ["p2_27", "THIS IS NOT YOUR FIRST PASS THROUGH", ["split"]],
    ["p2_28", "IT KNEW YOU WOULD STOP HERE", ["watching"]],
    ["p2_29", "YOU HAVE BEEN MAPPED ALREADY", ["grid"]],
    ["p2_30", "THE CITY IS STARTING TO KEEP YOU", ["city", "memory"]],
  ].map(([id, text, tags]) => ({ id, text, tags })),
  3: [
    ["p3_1", "WE SEE YOU", ["watching"]],
    ["p3_2", "YOU ARE EARLY", ["early"]],
    ["p3_3", "YOU SHOULD NOT BE HERE YET", ["watching"]],
    ["p3_4", "WE HEARD YOU BEFORE YOU ARRIVED", ["signal"]],
    ["p3_5", "YOU WERE QUIETER LAST TIME", ["memory"]],
    ["p3_6", "THIS LAYER IS CLOSER NOW", ["split"]],
    ["p3_7", "YOU OPENED SOMETHING", ["hidden"]],
    ["p3_8", "YOU TOUCHED THE WRONG SIGNAL", ["signal"]],
    ["p3_9", "YOU ARE NO LONGER UNSEEN", ["watching"]],
    ["p3_10", "WE KEPT YOUR PLACE", ["memory"]],
    ["p3_11", "YOU ARE STANDING IN A THIN SPOT", ["thin"]],
    ["p3_12", "SOMETHING IS LOOKING BACK", ["watching"]],
    ["p3_13", "YOU HAVE CROSSED INTO ITS MEMORY", ["memory"]],
    ["p3_14", "YOU ARE CLOSER THAN YOU THINK", ["split"]],
    ["p3_15", "THIS DISTRICT DOES NOT FORGET", ["memory"]],
    ["p3_16", "YOU WERE NOT MEANT TO NOTICE THAT", ["watching"]],
    ["p3_17", "WE HAVE BEEN WAITING UNDER THE NOISE", ["below", "noise"]],
    ["p3_18", "YOU HAVE DISTURBED THE LOWER PATTERN", ["below"]],
    ["p3_19", "THIS IS WHERE THE OTHER VERSION SHOWS THROUGH", ["split"]],
    ["p3_20", "WE REMEMBER YOUR PAUSE", ["memory"]],
    ["p3_21", "YOU ARE WALKING ON SOMETHING STORED", ["memory", "below"]],
    ["p3_22", "THE SIGNAL IS USING YOUR POSITION", ["signal"]],
    ["p3_23", "YOU HAVE ENTERED THE WRONG RHYTHM", ["signal"]],
    ["p3_24", "SOMETHING BELOW IS MATCHING YOUR STEPS", ["below"]],
    ["p3_25", "THIS PART OF THE CITY IS OPEN", ["city"]],
    ["p3_26", "YOU WERE CLOSER LAST TIME", ["memory"]],
    ["p3_27", "IT IS EASIER TO SEE YOU NOW", ["watching"]],
    ["p3_28", "THE BORDER IS THIN HERE", ["thin"]],
    ["p3_29", "WE DID NOT THINK YOU WOULD FIND THIS", ["watching"]],
    ["p3_30", "SOMETHING BENEATH IS AWAKE", ["below"]],
  ].map(([id, text, tags]) => ({ id, text, tags })),
  4: [
    ["p4_1", "THIS IS NOT THE FIRST VERSION", ["split"]],
    ["p4_2", "THE OTHER CITY IS STILL THERE", ["city", "split"]],
    ["p4_3", "THEY WERE NOT LOST. THEY WERE STORED.", ["memory"]],
    ["p4_4", "YOU HAVE WALKED HERE BEFORE, JUST NOT LIKE THIS", ["memory", "split"]],
    ["p4_5", "THERE IS A MEMORY UNDER EVERY STREET", ["memory", "below"]],
    ["p4_6", "THE LOWER CITY KEPT EVERYTHING", ["below", "memory"]],
    ["p4_7", "THIS PLACE ARCHIVED THE ONES WHO STAYED", ["archive", "memory"]],
    ["p4_8", "YOU ARE MOVING THROUGH A HELD BREATH", ["memory"]],
    ["p4_9", "NOTHING HERE FULLY ENDED", ["memory"]],
    ["p4_10", "THE SIGNALS ARE LEAKS FROM BELOW", ["signal", "below"]],
    ["p4_11", "WHAT YOU CALL EMPTY IS ONLY HIDDEN", ["hidden"]],
    ["p4_12", "THIS DISTRICT EXISTS TWICE", ["split"]],
    ["p4_13", "SOME BUILDINGS WERE NEVER REMOVED", ["city", "memory"]],
    ["p4_14", "THE CITY KEPT ITS EARLIER SELF", ["city", "memory"]],
    ["p4_15", "YOU ARE INSIDE SOMETHING REMEMBERING", ["memory"]],
    ["p4_16", "THE LIGHT ABOVE COVERS AN OLDER LIGHT", ["light", "memory"]],
    ["p4_17", "THE STREETS BELOW HAVE DIFFERENT NAMES", ["below"]],
    ["p4_18", "THIS MEMORY IS STILL ACTIVE", ["memory"]],
    ["p4_19", "THE SYSTEM SAVED MORE THAN IT SHOULD HAVE", ["archive"]],
    ["p4_20", "YOU ARE BEING READ BACK", ["archive", "watching"]],
    ["p4_21", "THE OTHER VERSION BLINKS THROUGH AT NIGHT", ["split", "night"]],
    ["p4_22", "SOME OF THESE FOOTSTEPS ARE YOURS", ["memory"]],
    ["p4_23", "YOU WERE RECORDED BEFORE YOU ARRIVED", ["archive"]],
    ["p4_24", "THIS SIGNAL IS OLDER THAN THE SURFACE", ["signal", "surface"]],
    ["p4_25", "THE CITY DID NOT BURY ITSELF DEEPLY ENOUGH", ["city", "below"]],
    ["p4_26", "BELOW THIS BLOCK, ANOTHER PATH CONTINUES", ["below"]],
    ["p4_27", "YOU ARE NOT OUTSIDE THE ARCHIVE", ["archive"]],
    ["p4_28", "WHAT REMEMBERS YOU IS NOT HUMAN", ["memory"]],
    ["p4_29", "THE LAYER BENEATH IS NOT PAST — IT IS PRESENT", ["below", "split"]],
    ["p4_30", "YOU WERE NEVER ONLY IN ONE CITY", ["city", "split"]],
  ].map(([id, text, tags]) => ({ id, text, tags })),
};

const BEHAVIOR_SIGNALS = {
  still: [
    "YOU STOPPED AGAIN",
    "IT GETS LOUDER WHEN YOU WAIT",
    "SOMETHING MOVED FIRST",
    "YOU CAN HEAR IT BETTER NOW",
  ],
  loop: [
    "YOU’VE DONE THIS BEFORE",
    "THE PATH IS CLOSING",
    "YOU ALWAYS CIRCLE BACK",
    "THIS LOOP IS NOT EMPTY",
  ],
  revisit: [
    "THIS PLACE KEPT YOUR SHAPE",
    "YOU LEFT SOMETHING HERE",
    "IT REMEMBERED YOU",
    "YOU WERE EXPECTED BACK",
  ],
  backtrack: [
    "YOU CHANGED YOUR MIND",
    "NOT THAT WAY",
    "YOU FELT IT TOO",
    "YOU TURNED BACK TOO SOON",
  ],
  hesitation: [
    "YOU ARE TAKING LONGER NOW",
    "SOMETHING IS DELAYING YOU",
    "YOU ARE NOT MOVING LIKE BEFORE",
    "IT IS WATCHING YOUR TIMING",
  ],
};

const RARE_SIGNALS = [
  "YOU WERE HERE BEFORE THIS VERSION",
  "SOMEONE ELSE USED YOUR STEPS",
  "THIS MEMORY IS NOT YOURS",
  "THE OTHER CITY SAW YOU FIRST",
  "YOU ARRIVED OUT OF ORDER",
  "THIS HAS ALREADY HAPPENED TOMORROW",
  "YOUR FOOTSTEPS DO NOT MATCH THE RECORD",
  "SOMETHING ELSE IS WALKING WHEN YOU STOP",
  "YOU WERE NOT THE ONE WHO STARTED THIS",
  "THE CITY CORRECTED YOU ONCE ALREADY",
];

const CLUES = [
  "A scrap of text reads: IT STARTS WHERE THE LIGHTS FAIL.",
  "A bent card hums faintly. The ink says: SOME NAMES WERE KEPT BELOW.",
  "A receipt with no date. On the back: THE OTHER VERSION BLINKS THROUGH.",
  "A torn map corner. Someone wrote: FOLLOW THE RHYTHM, NOT THE STREETS.",
  "A damp label, almost erased: NOTHING HERE FULLY ENDED.",
];

const SEQUENCES = [
  {
    id: "beneath",
    steps: [
      "THERE IS A STREET BELOW THIS ONE",
      "IT RUNS IN THE SAME DIRECTION",
      "IT REMEMBERS DIFFERENT NAMES",
    ],
  },
  {
    id: "light",
    steps: [
      "THE LIGHT FLICKERED",
      "THEN IT HELD ITS BREATH",
      "THEN THEY WERE GONE",
    ],
  },
];

function cloneMap(zone) {
  return zone.map.map((row) => row.split(""));
}

function findStart(grid) {
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x] === TILE.START) return { x, y };
    }
  }
  return { x: 1, y: 1 };
}

function replaceTile(grid, x, y, nextChar) {
  const next = grid.map((row) => [...row]);
  next[y][x] = nextChar;
  return next;
}

function randomChoice(items) {
  if (!items.length) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

function sampleWithoutRecent(items, recentIds, getId = (x) => x.id ?? x) {
  const filtered = items.filter((item) => !recentIds.includes(getId(item)));
  return randomChoice(filtered.length ? filtered : items);
}

function getPhase(signalsFoundCount, sequenceFragmentsFound) {
  if (
    signalsFoundCount >= PHASE_THRESHOLDS[4].minSignals &&
    sequenceFragmentsFound >= PHASE_THRESHOLDS[4].minSequenceFragments
  ) {
    return 4;
  }
  if (signalsFoundCount >= PHASE_THRESHOLDS[3].minSignals) return 3;
  if (signalsFoundCount >= PHASE_THRESHOLDS[2].minSignals) return 2;
  return 1;
}

function serializeState(state) {
  return JSON.stringify(state);
}

function deserializeState(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getInitialGameState() {
  const zoneIndex = 0;
  const zone = ZONES[zoneIndex];
  const grid = cloneMap(zone);
  const start = findStart(grid);
  const cleaned = replaceTile(grid, start.x, start.y, TILE.FLOOR);

  return {
    screen: "title",
    zoneIndex,
    player: start,
    maps: {
      [zone.id]: cleaned,
    },
    signalLog: [],
    clueLog: [],
    usedSignalIds: [],
    recentSignalIds: [],
    shownMilestones: [],
    shownRareSignals: [],
    sequenceProgress: {
      beneath: 0,
      light: 0,
    },
    stats: {
      hp: 3,
      keys: 0,
      signalsFound: 0,
      moves: 0,
    },
    popup: null,
    visitedZones: [zone.id],
    lastMoves: [],
    directionHistory: [],
    behaviorCooldowns: {
      stillUntilMove: 0,
      loopUntilMove: 0,
      revisitUntilMove: 0,
      backtrackUntilMove: 0,
      hesitationUntilMove: 0,
      rareUntilSignalCount: 0,
    },
    lastMoveAt: Date.now(),
    sessionStartAt: Date.now(),
  };
}

function App() {
  const [game, setGame] = useState(() => {
    const saved = deserializeState(localStorage.getItem(STORAGE_KEY));
    return saved || getInitialGameState();
  });
  const [showLog, setShowLog] = useState(false);
  const [showClues, setShowClues] = useState(false);
  const stillTimer = useRef(null);

  const zone = ZONES[game.zoneIndex];
  const currentGrid = useMemo(() => {
    const existing = game.maps[zone.id];
    if (existing) return existing;
    const grid = cloneMap(zone);
    const start = findStart(grid);
    return replaceTile(grid, start.x, start.y, TILE.FLOOR);
  }, [game.maps, zone]);

  const currentPhase = useMemo(() => {
    const fragments = Object.values(game.sequenceProgress).reduce((a, b) => a + b, 0);
    return getPhase(game.stats.signalsFound, fragments);
  }, [game.sequenceProgress, game.stats.signalsFound]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serializeState(game));
  }, [game]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (game.screen === "title") {
        if (event.key === "Enter") startGame();
        return;
      }
      if (game.popup) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          closePopup();
        }
        return;
      }
      if (event.key.toLowerCase() === "l") {
        setShowLog((v) => !v);
        return;
      }
      if (event.key.toLowerCase() === "c") {
        setShowClues((v) => !v);
        return;
      }
      if (event.key === "Escape") {
        setGame((prev) => ({ ...prev, screen: prev.screen === "paused" ? "playing" : "paused" }));
        return;
      }
      if (game.screen !== "playing" || showLog || showClues) return;

      const moves = {
        ArrowUp: { dx: 0, dy: -1, dir: "U" },
        ArrowDown: { dx: 0, dy: 1, dir: "D" },
        ArrowLeft: { dx: -1, dy: 0, dir: "L" },
        ArrowRight: { dx: 1, dy: 0, dir: "R" },
      };
      if (moves[event.key]) {
        event.preventDefault();
        movePlayer(moves[event.key]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game, showLog, showClues]);

  useEffect(() => {
    if (game.screen !== "playing" || game.popup) return undefined;
    if (stillTimer.current) clearTimeout(stillTimer.current);
    stillTimer.current = setTimeout(() => {
      tryBehaviorSignal("still");
    }, 6000);
    return () => {
      if (stillTimer.current) clearTimeout(stillTimer.current);
    };
  }, [game.player, game.screen, game.popup]);

  function startGame() {
    setGame((prev) => ({ ...prev, screen: "playing" }));
  }

  function resetGame() {
    const fresh = getInitialGameState();
    setGame(fresh);
    setShowLog(false);
    setShowClues(false);
    localStorage.setItem(STORAGE_KEY, serializeState(fresh));
  }

  function closePopup() {
    setGame((prev) => ({ ...prev, popup: null }));
  }

  function setPopup(title, text, kind = "signal") {
    setGame((prev) => ({
      ...prev,
      popup: { title, text, kind },
    }));
  }

  function ensureZoneMap(zoneIndex) {
    const z = ZONES[zoneIndex];
    return game.maps[z.id] || replaceTile(cloneMap(z), findStart(cloneMap(z)).x, findStart(cloneMap(z)).y, TILE.FLOOR);
  }

  function movePlayer({ dx, dy, dir }) {
    setGame((prev) => {
      const activeZone = ZONES[prev.zoneIndex];
      const grid = prev.maps[activeZone.id] || (() => {
        const fresh = cloneMap(activeZone);
        const start = findStart(fresh);
        return replaceTile(fresh, start.x, start.y, TILE.FLOOR);
      })();
      const nextX = prev.player.x + dx;
      const nextY = prev.player.y + dy;
      const target = grid[nextY]?.[nextX];
      if (!target || target === TILE.WALL) {
        return {
          ...prev,
          popup: { title: "BLOCKED", text: "The way is closed.", kind: "system" },
        };
      }

      const nextMoves = [...prev.lastMoves, `${nextX},${nextY}`].slice(-20);
      const nextDirectionHistory = [...prev.directionHistory, dir].slice(-8);
      const moveCount = prev.stats.moves + 1;
      const updated = {
        ...prev,
        player: { x: nextX, y: nextY },
        stats: { ...prev.stats, moves: moveCount },
        lastMoves: nextMoves,
        directionHistory: nextDirectionHistory,
        lastMoveAt: Date.now(),
      };

      const behaviorPopup = detectMovementBehavior(updated, activeZone);
      if (behaviorPopup) {
        updated.popup = behaviorPopup;
        return updated;
      }

      if (target === TILE.SIGNAL) {
        const tileCleared = replaceTile(grid, nextX, nextY, TILE.FLOOR);
        updated.maps = { ...prev.maps, [activeZone.id]: tileCleared };
        return applySignalEvent(updated, activeZone);
      }

      if (target === TILE.CLUE) {
        const clue = randomChoice(CLUES);
        const tileCleared = replaceTile(grid, nextX, nextY, TILE.FLOOR);
        updated.maps = { ...prev.maps, [activeZone.id]: tileCleared };
        if (!updated.clueLog.includes(clue)) updated.clueLog = [...updated.clueLog, clue];
        updated.popup = { title: "CLUE FOUND", text: clue, kind: "clue" };
        return updated;
      }

      if (target === TILE.DOOR) {
        const nextZoneIndex = Math.min(prev.zoneIndex + 1, ZONES.length - 1);
        if (nextZoneIndex === prev.zoneIndex) {
          updated.popup = {
            title: "EDGE OF THE CITY",
            text: "For now, this is as far as the signal reaches.",
            kind: "system",
          };
          return updated;
        }

        const nextZone = ZONES[nextZoneIndex];
        let nextGrid = prev.maps[nextZone.id];
        if (!nextGrid) {
          const fresh = cloneMap(nextZone);
          const start = findStart(fresh);
          nextGrid = replaceTile(fresh, start.x, start.y, TILE.FLOOR);
        }
        const nextStart = findStart(cloneMap(nextZone));
        const revisiting = prev.visitedZones.includes(nextZone.id);

        return {
          ...updated,
          zoneIndex: nextZoneIndex,
          player: nextStart,
          maps: { ...updated.maps, [nextZone.id]: nextGrid },
          visitedZones: revisiting ? prev.visitedZones : [...prev.visitedZones, nextZone.id],
          popup: revisiting
            ? pickBehaviorPopup("revisit", updated)
            : {
                title: nextZone.name.toUpperCase(),
                text: `You enter ${nextZone.name}.`,
                kind: "system",
              },
        };
      }

      return updated;
    });
  }

  function detectMovementBehavior(state, activeZone) {
    const { moves } = state.stats;
    const cooldowns = state.behaviorCooldowns;
    const history = state.lastMoves;
    const dirs = state.directionHistory;
    const now = Date.now();

    if (now - state.lastMoveAt > 3000 && moves >= cooldowns.hesitationUntilMove) {
      state.behaviorCooldowns = { ...cooldowns, hesitationUntilMove: moves + 20 };
      return pickBehaviorPopup("hesitation", state);
    }

    const reversals = dirs.slice(-4).join("");
    const reversedPatterns = ["LRLR", "RLRL", "UDUD", "DUDU", "L R L R", "U D U D"];
    if (reversedPatterns.includes(reversals) && moves >= cooldowns.backtrackUntilMove) {
      state.behaviorCooldowns = { ...cooldowns, backtrackUntilMove: moves + 20 };
      return pickBehaviorPopup("backtrack", state);
    }

    if (history.length >= 12) {
      const last12 = history.slice(-12);
      const unique = new Set(last12);
      if (unique.size <= 4 && moves >= cooldowns.loopUntilMove) {
        state.behaviorCooldowns = { ...cooldowns, loopUntilMove: moves + 25 };
        return pickBehaviorPopup("loop", state);
      }
    }

    if (state.visitedZones.filter((z) => z === activeZone.id).length > 1 && moves >= cooldowns.revisitUntilMove) {
      state.behaviorCooldowns = { ...cooldowns, revisitUntilMove: moves + 25 };
      return pickBehaviorPopup("revisit", state);
    }

    return null;
  }

  function pickBehaviorPopup(kind, state) {
    const text = randomChoice(BEHAVIOR_SIGNALS[kind] || ["THE CITY NOTICED SOMETHING"]);
    return { title: "SIGNAL RECEIVED", text, kind: "signal" };
  }

  function applySignalEvent(state, activeZone) {
    const nextSignalCount = state.stats.signalsFound + 1;
    const currentFragments = Object.values(state.sequenceProgress).reduce((a, b) => a + b, 0);

    const sequence = maybeGetSequenceSignal(state, activeZone);
    if (sequence) {
      const nextProgress = { ...state.sequenceProgress, [sequence.sequenceId]: sequence.nextStep };
      return recordSignal(state, {
        id: `${sequence.sequenceId}_${sequence.nextStep}`,
        text: sequence.text,
        kind: "sequence",
        nextSignalCount,
        nextSequenceProgress: nextProgress,
      });
    }

    const milestone = maybeGetMilestoneSignal(state, nextSignalCount, currentFragments);
    if (milestone) {
      return recordSignal(state, {
        id: milestone.id,
        text: milestone.text,
        kind: "milestone",
        nextSignalCount,
        nextSequenceProgress: state.sequenceProgress,
      });
    }

    const behavior = maybeGetBehaviorSignalForSignalEvent(state);
    if (behavior) {
      return recordSignal(state, {
        id: `behavior_${Date.now()}`,
        text: behavior,
        kind: "behavior",
        nextSignalCount,
        nextSequenceProgress: state.sequenceProgress,
      });
    }

    const rare = maybeGetRareSignal(state, nextSignalCount);
    if (rare) {
      return recordSignal(state, {
        id: `rare_${rare}`,
        text: rare,
        kind: "rare",
        nextSignalCount,
        nextSequenceProgress: state.sequenceProgress,
      });
    }

    const phase = getPhase(nextSignalCount, currentFragments);
    const core = pickCoreSignal(state, activeZone, phase);
    return recordSignal(state, {
      id: core.id,
      text: core.text,
      kind: "core",
      nextSignalCount,
      nextSequenceProgress: state.sequenceProgress,
    });
  }

  function maybeGetSequenceSignal(state, activeZone) {
    if (state.stats.signalsFound < 6) return null;

    const beneath = state.sequenceProgress.beneath;
    if (beneath < 3) {
      if (beneath === 0 && state.stats.signalsFound >= 6) {
        return { sequenceId: "beneath", nextStep: 1, text: SEQUENCES[0].steps[0] };
      }
      if (beneath === 1 && activeZone.tags.includes("below")) {
        return { sequenceId: "beneath", nextStep: 2, text: SEQUENCES[0].steps[1] };
      }
      if (beneath === 2 && state.stats.moves >= 10) {
        return { sequenceId: "beneath", nextStep: 3, text: SEQUENCES[0].steps[2] };
      }
    }

    const light = state.sequenceProgress.light;
    if (light < 3) {
      if (light === 0 && state.stats.signalsFound >= 10) {
        return { sequenceId: "light", nextStep: 1, text: SEQUENCES[1].steps[0] };
      }
      if (light === 1 && activeZone.tags.includes("light")) {
        return { sequenceId: "light", nextStep: 2, text: SEQUENCES[1].steps[1] };
      }
      if (light === 2 && state.stats.signalsFound >= 12) {
        return { sequenceId: "light", nextStep: 3, text: SEQUENCES[1].steps[2] };
      }
    }

    return null;
  }

  function maybeGetMilestoneSignal(state, nextSignalCount, sequenceFragmentsFound) {
    return MILESTONES.find((m) => {
      if (state.shownMilestones.includes(m.id)) return false;
      if (nextSignalCount !== m.atSignals) return false;
      if (m.minSequenceFragments && sequenceFragmentsFound < m.minSequenceFragments) return false;
      return true;
    });
  }

  function maybeGetBehaviorSignalForSignalEvent(state) {
    const moveCount = state.stats.moves;
    if (moveCount > 0 && moveCount % 17 === 0) {
      return randomChoice(BEHAVIOR_SIGNALS.hesitation);
    }
    return null;
  }

  function maybeGetRareSignal(state, nextSignalCount) {
    if (nextSignalCount < 8) return null;
    if (state.stats.signalsFound < state.behaviorCooldowns.rareUntilSignalCount) return null;
    if (Math.random() > 0.02) return null;
    const available = RARE_SIGNALS.filter((text) => !state.shownRareSignals.includes(text));
    if (!available.length) return null;
    return randomChoice(available);
  }

  function pickCoreSignal(state, activeZone, phase) {
    const pool = PHASE_SIGNALS[phase] || [];
    const weighted = [];
    for (const signal of pool) {
      let weight = 1;
      if (!state.usedSignalIds.includes(signal.id)) weight += 3;
      if (signal.tags.some((t) => activeZone.tags.includes(t))) weight += 2;
      if (!state.recentSignalIds.includes(signal.id)) weight += 2;
      for (let i = 0; i < weight; i += 1) weighted.push(signal);
    }
    return sampleWithoutRecent(weighted, state.recentSignalIds, (s) => s.id) || pool[0];
  }

  function recordSignal(state, { id, text, kind, nextSignalCount, nextSequenceProgress }) {
    const logEntry = {
      id,
      text,
      kind,
      zone: ZONES[state.zoneIndex].name,
      index: state.signalLog.length + 1,
      phase: getPhase(nextSignalCount, Object.values(nextSequenceProgress).reduce((a, b) => a + b, 0)),
    };

    const nextShownMilestones = kind === "milestone" ? [...state.shownMilestones, id] : state.shownMilestones;
    const nextShownRareSignals = kind === "rare" ? [...state.shownRareSignals, text] : state.shownRareSignals;

    return {
      ...state,
      signalLog: [...state.signalLog, logEntry],
      usedSignalIds: state.usedSignalIds.includes(id) ? state.usedSignalIds : [...state.usedSignalIds, id],
      recentSignalIds: [...state.recentSignalIds, id].slice(-12),
      shownMilestones: nextShownMilestones,
      shownRareSignals: nextShownRareSignals,
      sequenceProgress: nextSequenceProgress,
      stats: {
        ...state.stats,
        signalsFound: nextSignalCount,
      },
      behaviorCooldowns: {
        ...state.behaviorCooldowns,
        rareUntilSignalCount: kind === "rare" ? nextSignalCount + 10 : state.behaviorCooldowns.rareUntilSignalCount,
      },
      popup: {
        title: kind === "milestone" ? "MILESTONE SIGNAL" : "SIGNAL RECEIVED",
        text,
        kind: "signal",
      },
    };
  }

  function renderGrid() {
    return currentGrid.map((row, y) => {
      const display = row.map((char, x) => {
        if (game.player.x === x && game.player.y === y) return "@";
        return char;
      });
      return display.join("");
    });
  }

  const gridLines = renderGrid();

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-3xl border border-white/20 shadow-2xl p-4 md:p-6 bg-black">
        <style>{`
          .crt { text-shadow: 0 0 8px rgba(255,255,255,0.12); }
          .scanlines { background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 100% 4px; }
          .btn { border: 1px solid rgba(255,255,255,0.25); padding: 0.65rem 0.9rem; border-radius: 1rem; }
          .btn:active { transform: scale(0.98); }
        `}</style>

        {game.screen === "title" ? (
          <div className="crt scanlines text-center space-y-6 py-16">
            <div>
              <div className="text-3xl md:text-5xl tracking-widest">CITY SIGNAL</div>
              <div className="mt-3 text-white/60">A terminal dream beneath the city.</div>
            </div>
            <div className="space-y-3 max-w-sm mx-auto">
              <button className="btn w-full" onClick={startGame}>
                &gt; START
              </button>
              <button className="btn w-full" onClick={() => setShowLog((v) => !v)}>
                SIGNAL LOG
              </button>
              <button className="btn w-full" onClick={resetGame}>
                RESET
              </button>
            </div>
            <div className="text-xs text-white/50">Press Enter to start</div>
          </div>
        ) : (
          <div className="crt scanlines space-y-4">
            <div className="border border-white/20 rounded-2xl p-3 md:p-4">
              <div className="flex flex-wrap gap-3 justify-between text-sm md:text-base">
                <div>ZONE: {zone.name.toUpperCase()}</div>
                <div>PHASE: {currentPhase}</div>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/80">
                <div>SIG: {game.stats.signalsFound}</div>
                <div>HP: {game.stats.hp}</div>
                <div>SEQ: {Object.values(game.sequenceProgress).reduce((a, b) => a + b, 0)}</div>
                <div>MOVES: {game.stats.moves}</div>
              </div>
            </div>

            <div className="border border-white/20 rounded-2xl p-3 md:p-4 overflow-auto">
              <pre className="text-sm md:text-lg leading-5 md:leading-6 whitespace-pre-wrap break-normal">{gridLines.join("\n")}</pre>
            </div>

            <div className="border border-white/20 rounded-2xl p-3 md:p-4 min-h-24">
              {game.popup ? (
                <div className="space-y-2">
                  <div className="text-white/70">&gt; {game.popup.title}</div>
                  <div className="text-lg">{game.popup.text}</div>
                  <div className="text-xs text-white/50">Press Enter or tap Continue</div>
                  <button className="btn mt-2" onClick={closePopup}>CONTINUE</button>
                </div>
              ) : game.screen === "paused" ? (
                <div className="space-y-2">
                  <div>&gt; PAUSED</div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn" onClick={() => setGame((prev) => ({ ...prev, screen: "playing" }))}>RESUME</button>
                    <button className="btn" onClick={() => setShowLog((v) => !v)}>SIGNAL LOG</button>
                    <button className="btn" onClick={() => setShowClues((v) => !v)}>CLUES</button>
                    <button className="btn" onClick={resetGame}>RESET</button>
                  </div>
                </div>
              ) : (
                <div className="text-white/70">Use arrow keys or touch controls. L = log, C = clues, Esc = pause.</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-2">
              <div />
              <button className="btn" onClick={() => game.screen === "playing" && !game.popup && movePlayer({ dx: 0, dy: -1, dir: "U" })}>↑</button>
              <div />
              <button className="btn" onClick={() => game.screen === "playing" && !game.popup && movePlayer({ dx: -1, dy: 0, dir: "L" })}>←</button>
              <button className="btn" onClick={() => game.screen === "playing" && !game.popup && movePlayer({ dx: 0, dy: 1, dir: "D" })}>↓</button>
              <button className="btn" onClick={() => game.screen === "playing" && !game.popup && movePlayer({ dx: 1, dy: 0, dir: "R" })}>→</button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button className="btn" onClick={() => setShowLog((v) => !v)}>SIGNAL LOG</button>
              <button className="btn" onClick={() => setShowClues((v) => !v)}>CLUES</button>
              <button className="btn" onClick={() => setGame((prev) => ({ ...prev, screen: prev.screen === "paused" ? "playing" : "paused" }))}>
                {game.screen === "paused" ? "RESUME" : "PAUSE"}
              </button>
            </div>
          </div>
        )}

        {showLog && (
          <div className="mt-4 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xl">SIGNAL LOG</div>
              <button className="btn" onClick={() => setShowLog(false)}>CLOSE</button>
            </div>
            <div className="space-y-2 max-h-72 overflow-auto">
              {game.signalLog.length ? (
                game.signalLog.map((entry) => (
                  <div key={`${entry.id}-${entry.index}`} className="border border-white/10 rounded-xl p-3">
                    <div className="text-white/60 text-xs">[{String(entry.index).padStart(2, "0")}] {entry.zone} · PHASE {entry.phase}</div>
                    <div className="mt-1">{entry.text}</div>
                  </div>
                ))
              ) : (
                <div className="text-white/60">No signals logged yet.</div>
              )}
            </div>
          </div>
        )}

        {showClues && (
          <div className="mt-4 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xl">CLUES</div>
              <button className="btn" onClick={() => setShowClues(false)}>CLOSE</button>
            </div>
            <div className="space-y-2 max-h-72 overflow-auto">
              {game.clueLog.length ? (
                game.clueLog.map((clue, index) => (
                  <div key={`${clue}-${index}`} className="border border-white/10 rounded-xl p-3">
                    <div className="text-white/60 text-xs">CLUE {index + 1}</div>
                    <div className="mt-1">{clue}</div>
                  </div>
                ))
              ) : (
                <div className="text-white/60">No clues collected yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

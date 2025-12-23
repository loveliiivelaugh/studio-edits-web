// import * as React from 'react';
// import {
//   Box,
//   Button,
//   IconButton,
//   Stack,
//   Typography,
//   useMediaQuery,
//   Theme,
//   Tooltip,
// } from '@mui/material';
// import { motion, AnimatePresence } from 'framer-motion';
// import EditorTimeline from '@components/custom/VideoEditor/EditorTimeline';
// import { useStudioStore } from '@store/useStudioStore';
// import { useEditorUiStore } from '@store/useEditorUiStore';
// import { useSmartEdit } from '@store/useSmartEdit';
// import { useEditorPlayback } from '@store/useEditorPlayback';
// import { useParams } from 'react-router';


// const EmptyState = () => {
//     return (
//         <Box>
//             <Typography variant='h4'>No project selected</Typography>
//         </Box>
//     )
//     // return (
//     //     <View style={styles.emptyState}>
//     //         <Text style={styles.emptyStateText}>No project selected</Text>
//     //     </View>
//     // )
// };

// type ActiveTool = 'tl' | 'tx' | 'mu' | 'fx' | 'ml' | 'ai' | 'ch' | 'ex';

// const toolDefs: Array<{ key: ActiveTool; label: string; emoji: string }> = [
//   { key: 'tl', label: 'Timeline', emoji: '🎥' },
//   { key: 'tx', label: 'Text', emoji: '✏️' },
//   { key: 'mu', label: 'Music', emoji: '🎵' },
//   { key: 'fx', label: 'Effects', emoji: '🎬' },
//   { key: 'ml', label: 'ML', emoji: '🧠' },
//   { key: 'ai', label: 'AI', emoji: '✨' },
//   { key: 'ch', label: 'Chat', emoji: '💬' },
//   { key: 'ex', label: 'Export', emoji: '📦' },
// ];

// function formatTime(sec: number) {
//   const s = Math.max(0, Math.floor(sec));
//   const m = Math.floor(s / 60);
//   const r = s % 60;
//   return `${m}:${r.toString().padStart(2, '0')}`;
// }

// export default function EditorPage() {
//     const params = useParams();
//     console.log("Params: ", params)
// const projectId = params.projectId;
// // const { projectId } = useLocalSearchParams<{ projectId?: string }>();
//   const project = useStudioStore((s) =>
//     projectId ? s.projects.find((p) => p.id === projectId) : undefined
//   );

//   const ui = useEditorUiStore();
//   const smartEdit = useSmartEdit({ project });
//   const playback = useEditorPlayback({
//     project,
//     smartPreviewUrl: smartEdit.smartPreviewUrl,
//   });


// //   if (!project) return <EmptyState />;

//   const isLandscape = useMediaQuery((t: Theme) => t.breakpoints.up('md'));
//   const [activeTool, setActiveTool] = React.useState<ActiveTool>('ch');
//   const [isPlaying, setIsPlaying] = React.useState(false);

//   // demo time values
//   const [currentTime, setCurrentTime] = React.useState(0);
//   const duration = 0; // your real duration later

//   React.useEffect(() => {
//     if (!isPlaying) return;
//     const id = window.setInterval(() => setCurrentTime((t) => t + 1), 1000);
//     return () => window.clearInterval(id);
//   }, [isPlaying]);

// //   return <>Editor Page</>

//   return (
//     <Box
//       sx={{
//         mt: 20,
//         // position: 'relative',
//         minHeight: '100vh',
//         bgcolor: '#020617',
//         // overflow: 'hidden',
//       }}
//     >
//       {/* background glow */}
//       <Box
//         component={motion.div}
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.5, ease: 'easeOut' }}
//         sx={{
//           position: 'absolute',
//           inset: -200,
//           background:
//             'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.22), transparent 45%),' +
//             'radial-gradient(circle at 85% 25%, rgba(34,197,94,0.14), transparent 48%),' +
//             'radial-gradient(circle at 65% 85%, rgba(236,72,153,0.12), transparent 52%)',
//           filter: 'blur(18px)',
//           pointerEvents: 'none',
//         }}
//       />

//       {/* CANVAS */}
//       <Box
//         sx={{
//           position: 'absolute',
//           inset: 0,
//           display: 'grid',
//           placeItems: 'center',
//           px: 2,
//           pb: 12, // room for bottom controls
//         }}
//       >
//         <Box
//           sx={{
//             width: '100%',
//             height: '100%',
//             maxHeight: "80%",
//             borderRadius: 3,
//             border: '1px solid rgba(148,163,184,0.18)',
//             background:
//               'linear-gradient(180deg, rgba(2,6,23,0.35), rgba(2,6,23,0.85))',
//             boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
//             position: 'relative',
//             overflow: 'hidden',
//           }}
//         >
//           {/* fake video frame */}
//           <Box
//             sx={{
//               position: 'absolute',
//               inset: 0,
//               background:
//                 'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.06), transparent 45%)',
//             }}
//           />

//           {/* subtle inner vignette */}
//           <Box
//             sx={{
//               position: 'absolute',
//               inset: 0,
//               background:
//                 'radial-gradient(circle at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 78%)',
//               pointerEvents: 'none',
//             }}
//           />

//           {/* bottom transport row (Play + time) */}
//           <Box
//             sx={{
//               position: 'absolute',
//               left: 16,
//               right: 16,
//               bottom: 84,
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'space-between',
//               gap: 2,
//               pointerEvents: 'none', // allow canvas gestures later; buttons override below
//             }}
//           >
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
//               {/* scrubber dot */}
//               <Box
//                 sx={{
//                   width: 18,
//                   height: 18,
//                   borderRadius: 999,
//                   bgcolor: '#6366f1',
//                   boxShadow: '0 0 0 6px rgba(99,102,241,0.15)',
//                 }}
//               />
//               <Button
//                 component={motion.button}
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//                 onClick={() => setIsPlaying((v) => !v)}
//                 sx={{
//                   pointerEvents: 'auto',
//                   textTransform: 'none',
//                   borderRadius: 999,
//                   px: 2,
//                   py: 0.75,
//                   fontWeight: 900,
//                   bgcolor: '#4f46e5',
//                   color: '#E0E7FF',
//                   '&:hover': { bgcolor: '#4338CA' },
//                   minWidth: 72,
//                 }}
//               >
//                 {isPlaying ? 'Pause' : 'Play'}
//               </Button>
//             </Box>

//             <Typography
//               sx={{
//                 pointerEvents: 'none',
//                 color: 'rgba(148,163,184,0.9)',
//                 fontSize: 12,
//                 fontWeight: 800,
//               }}
//             >
//               {formatTime(currentTime)} / {formatTime(duration)}
//             </Typography>
//           </Box>

//           {/* timeline panel bottom-left */}
//           <Box
//             sx={{
//               position: 'absolute',
//               left: 16,
//               bottom: 18,
//               width: isLandscape ? 420 : 320,
//               maxWidth: '75vw',
//             }}
//           >
//             <Typography
//               sx={{
//                 color: 'rgba(148,163,184,0.75)',
//                 fontSize: 12,
//                 fontWeight: 800,
//                 mb: 1,
//               }}
//             >
//               Timeline
//             </Typography>

//             <Stack direction="row" spacing={1} sx={{ mb: 1.25 }}>
//               <Button
//                 variant="outlined"
//                 sx={{
//                   borderRadius: 999,
//                   textTransform: 'none',
//                   fontWeight: 800,
//                   fontSize: 12,
//                   color: '#E5E7EB',
//                   borderColor: 'rgba(148,163,184,0.28)',
//                   bgcolor: 'rgba(15,23,42,0.55)',
//                   '&:hover': {
//                     borderColor: '#818CF8',
//                     bgcolor: 'rgba(30,41,59,0.75)',
//                   },
//                 }}
//               >
//                 Trim
//               </Button>

//               <Button
//                 variant="contained"
//                 sx={{
//                   borderRadius: 12,
//                   textTransform: 'none',
//                   fontWeight: 900,
//                   fontSize: 12,
//                   bgcolor: 'rgba(15,23,42,0.75)',
//                   color: '#E5E7EB',
//                   boxShadow: 'none',
//                   border: '1px solid rgba(148,163,184,0.18)',
//                   '&:hover': { bgcolor: 'rgba(30,41,59,0.85)' },
//                 }}
//               >
//                 Add clip +
//               </Button>
//             </Stack>

//             {/* stub: timeline track */}
//             <Box
//               sx={{
//                 height: 10,
//                 borderRadius: 999,
//                 bgcolor: 'rgba(148,163,184,0.18)',
//                 overflow: 'hidden',
//               }}
//             >
//               <Box
//                 sx={{
//                   width: '35%',
//                   height: '100%',
//                   bgcolor: 'rgba(99,102,241,0.65)',
//                 }}
//               />
//             </Box>
//           </Box>
//         </Box>
//       </Box>

//       {/* RIGHT FLOATING TOOL DOCK */}
//       <Box
//         sx={{
//           position: 'absolute',
//           top: 86,
//           right: 14,
//           zIndex: 20,
//         }}
//       >
//         <Box
//           sx={{
//             p: 0.75,
//             borderRadius: 999,
//             border: '1px solid rgba(148,163,184,0.28)',
//             bgcolor: 'rgba(2,6,23,0.55)',
//             backdropFilter: 'blur(10px)',
//             boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
//           }}
//         >
//           <Stack spacing={1}>
//             {toolDefs.map((t) => {
//               const active = activeTool === t.key;
//               return (
//                 <Tooltip key={t.key} title={`${t.emoji} ${t.label}`} placement="left">
//                   <IconButton
//                     onClick={() => setActiveTool(t.key)}
//                     sx={{
//                       width: 46,
//                       height: 46,
//                       borderRadius: 999,
//                       border: '1px solid',
//                       borderColor: active ? 'rgba(129,140,248,0.75)' : 'rgba(148,163,184,0.22)',
//                       bgcolor: active ? 'rgba(79,70,229,0.85)' : 'rgba(15,23,42,0.70)',
//                       color: '#E5E7EB',
//                       boxShadow: active ? '0 10px 24px rgba(79,70,229,0.35)' : 'none',
//                       '&:hover': {
//                         bgcolor: active ? 'rgba(79,70,229,0.95)' : 'rgba(30,41,59,0.80)',
//                       },
//                       display: 'grid',
//                       placeItems: 'center',
//                     }}
//                   >
//                     <Typography sx={{ fontSize: 12, fontWeight: 900, lineHeight: 1 }}>
//                       {t.emoji}
//                       <Box component="span" sx={{ opacity: 0.9, ml: 0.35 }}>
//                         {t.key.toUpperCase()}
//                       </Box>
//                     </Typography>
//                   </IconButton>
//                 </Tooltip>
//               );
//             })}
//           </Stack>
//         </Box>
//       </Box>

//       {/* OPTIONAL: active tool panel stub (slide up / toast) */}
//       <AnimatePresence>
//         {/* @ts-ignore */}
//         {activeTool !== 'none' && (
//           <Box
//             component={motion.div}
//             initial={{ y: 24, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             exit={{ y: 24, opacity: 0 }}
//             transition={{ duration: 0.2 }}
//             sx={{
//               position: 'absolute',
//               left: 16,
//               bottom: 40,
//               px: 1.25,
//               py: 0.75,
//               borderRadius: 999,
//               border: '1px solid rgba(148,163,184,0.18)',
//               bgcolor: 'rgba(2,6,23,0.55)',
//               color: 'rgba(226,232,240,0.92)',
//               fontSize: 12,
//               fontWeight: 900,
//               backdropFilter: 'blur(10px)',
//               width: "98%"
//             }}
//           >
//             Active tool: {activeTool.toUpperCase() === "tl" ? "Timeline" : "Other"}
//             <EditorTimeline project={project} ui={ui} 
//                 // playback={playback} 
//             />
//             {/* {activeTool.toUpperCase() === 'timeline' && (
//                 // project={project} ui={ui} playback={playback} />
//             )} */}
//             {/* @ts-ignore */}
//             {/* <EditorTimeline /> */}
//             {/* {activeTool.toUpperCase() === 'music' && (
//                 <EditorMusicPanel project={project} ui={ui} />
//             )}
//             {activeTool.toUpperCase() === 'text' && (
//                 <EditorTextPanel project={project} ui={ui} />
//             )}
//             {activeTool.toUpperCase() === 'effects' && (
//                 <EditorEffectsPanel project={project} ui={ui} />
//             )}
//             {activeTool.toUpperCase() === 'ml' && (
//                 <EditorMlPanel ui={ui} />
//             )}
//             {activeTool.toUpperCase() === 'ai' && (
//                 <EditorAiPanel ui={ui} smartEdit={smartEdit} />
//             )}
//             {activeTool.toUpperCase() === 'export' && (
//                 <EditorExportPanel project={project} ui={ui} />
//             )}
//             {activeTool.toUpperCase() === 'chat' && (
//                 <EditorChatPanel projectId={project.id} />
//             )} */}
//           </Box>
//         )}
//       </AnimatePresence>
//     </Box>
//   );
// }
// src/pages/EditorPage.tsx
import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  Theme,
  Tooltip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

import { useStudioStore } from '@store/useStudioStore';
import { useEditorUiStore } from '@store/useEditorUiStore';
import { useEditorPlayback } from '@store/useEditorPlayback';
import { useSmartEdit } from '@store/useSmartEdit';

import EditorTimeline from '@components/custom/VideoEditor/EditorTimeline';
// BottomToolBar.tsx (or inline in EditorPage)
// import * as React from 'react';
// import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
// import { motion } from 'framer-motion';
import { Paper } from "@mui/material";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

type ToolDef<T extends string> = { key: T; label: string; emoji: string };

export function BottomToolBar<T extends string>({
  toolDefs,
  activeTool,
  setActiveTool,
  onExit,
}: {
  toolDefs: ToolDef<T>[];
  activeTool: T;
  setActiveTool: (t: T) => void;
  onExit: () => void;
}) {
  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        px: 1.25,
        pb: 1.25,
        // keeps it comfy above iOS PWA safe-area
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)',
        pointerEvents: 'none',
      }}
    >
      <Paper
        component={motion.div}
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        elevation={0}
        sx={{
          pointerEvents: 'auto',
          mx: 'auto',
          maxWidth: 980,
          borderRadius: 999,
          border: '1px solid rgba(148,163,184,0.20)',
          bgcolor: 'rgba(2,6,23,0.70)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
          px: 1,
          py: 0.75,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          {/* EXIT */}
          <Tooltip title="Exit editor" placement="top">
            <IconButton
              onClick={onExit}
              sx={{
                width: 46,
                height: 46,
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.22)',
                bgcolor: 'rgba(15,23,42,0.70)',
                color: '#E5E7EB',
                '&:hover': { bgcolor: 'rgba(30,41,59,0.85)' },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* TOOLS */}
          <Box
            sx={{
              flex: 1,
              overflowX: 'auto',
              px: 0.75,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(148,163,184,0.22)', borderRadius: 999 },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 'max-content' }}>
              {toolDefs.map((t) => {
                const active = activeTool === t.key;
                return (
                  <Tooltip key={t.key} title={`${t.emoji} ${t.label}`} placement="top">
                    <IconButton
                      onClick={() => setActiveTool(t.key)}
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 999,
                        border: '1px solid',
                        borderColor: active
                          ? 'rgba(129,140,248,0.75)'
                          : 'rgba(148,163,184,0.22)',
                        bgcolor: active ? 'rgba(79,70,229,0.85)' : 'rgba(15,23,42,0.70)',
                        color: '#E5E7EB',
                        boxShadow: active ? '0 10px 24px rgba(79,70,229,0.35)' : 'none',
                        '&:hover': {
                          bgcolor: active ? 'rgba(79,70,229,0.95)' : 'rgba(30,41,59,0.80)',
                        },
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Typography sx={{ fontSize: 12, fontWeight: 900, lineHeight: 1 }}>
                        {t.emoji}
                        <Box component="span" sx={{ opacity: 0.9, ml: 0.35 }}>
                          {String(t.key).slice(0, 2).toUpperCase()}
                        </Box>
                      </Typography>
                    </IconButton>
                  </Tooltip>
                );
              })}
            </Stack>
          </Box>

          {/* spacer to balance exit button */}
          <Box sx={{ width: 46 }} />
        </Stack>
      </Paper>
    </Box>
  );
}

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

const EmptyState = () => (
  <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
    <Typography variant="h5" sx={{ color: 'rgba(148,163,184,0.9)', fontWeight: 900 }}>
      No project selected
    </Typography>
  </Box>
);

const toolDefs: Array<{
  key: import('@store/useEditorUiStore').ActiveTool;
  label: string;
  emoji: string;
}> = [
  { key: 'timeline', label: 'Timeline', emoji: '🎥' },
  { key: 'text', label: 'Text', emoji: '✏️' },
  { key: 'music', label: 'Music', emoji: '🎵' },
  { key: 'effects', label: 'Effects', emoji: '🎬' },
  { key: 'ml', label: 'ML', emoji: '🧠' },
  { key: 'ai', label: 'AI', emoji: '✨' },
  { key: 'chat', label: 'Chat', emoji: '💬' },
  { key: 'export', label: 'Export', emoji: '📦' },
];

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useStudioStore((s) =>
    projectId ? s.projects.find((p) => p.id === projectId) : undefined
  );

  const ui = useEditorUiStore();
  const isLandscape = useMediaQuery((t: Theme) => t.breakpoints.up('md'));

  React.useEffect(() => {
    ui.setSelectedProjectId(projectId);
    // hydrate clips into ui for “session editing”, if you want this pattern:
    if (project?.clips) ui.setClips(project.clips);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, project?.id]);

  const smartEdit = useSmartEdit({ project });
  const playback = useEditorPlayback({
    project,
    smartPreviewUrl: smartEdit.smartPreviewUrl,
  });

  const navigate = useNavigate();

//   if (!project) return <EmptyState />;

  const showReplay =
    !ui.isPlaying && playback.duration > 0 && ui.currentTime >= playback.duration - 0.05;

  return (
    <Box
      sx={{
        // position: 'relative',
        // minHeight: '100vh',
        bgcolor: '#020617',
        overflow: 'hidden',
      }}
    >
      {/* background glow */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        sx={{
          position: 'absolute',
          inset: -200,
          background:
            'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.22), transparent 45%),' +
            'radial-gradient(circle at 85% 25%, rgba(34,197,94,0.14), transparent 48%),' +
            'radial-gradient(circle at 65% 85%, rgba(236,72,153,0.12), transparent 52%)',
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
      />

      {/* CANVAS */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          px: 2,
          pb: 12,
          mt: 4
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            maxHeight: '80%',
            borderRadius: 3,
            border: '1px solid rgba(148,163,184,0.18)',
            background:
              'linear-gradient(180deg, rgba(2,6,23,0.35), rgba(2,6,23,0.85))',
            boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Real video */}
          {playback.videoSourceUri ? (
            <Box
              component="video"
              ref={playback.videoRef}
              src={playback.videoSourceUri}
              playsInline
              preload="metadata"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000',
              }}
            />
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontWeight: 900 }}>
                Add a clip to start
              </Typography>
            </Box>
          )}

          {/* vignette */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 78%)',
              pointerEvents: 'none',
            }}
          />

          {/* transport */}
          <Box
            sx={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 84,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              pointerEvents: 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  bgcolor: '#6366f1',
                  boxShadow: '0 0 0 6px rgba(99,102,241,0.15)',
                }}
              />
              <Button
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (showReplay) playback.replay();
                  else playback.togglePlayPause();
                }}
                sx={{
                  pointerEvents: 'auto',
                  textTransform: 'none',
                  borderRadius: 999,
                  px: 2,
                  py: 0.75,
                  fontWeight: 900,
                  bgcolor: '#4f46e5',
                  color: '#E0E7FF',
                  '&:hover': { bgcolor: '#4338CA' },
                  minWidth: 88,
                }}
              >
                {ui.isPlaying ? 'Pause' : showReplay ? 'Replay' : 'Play'}
              </Button>
            </Box>

            <Typography
              sx={{
                pointerEvents: 'none',
                color: 'rgba(148,163,184,0.9)',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {formatTime(ui.currentTime)} / {formatTime(playback.duration)}
            </Typography>
          </Box>

        </Box>
        {/* bottom-left panel content */}
        <Box
            sx={{
                position: 'absolute',
                left: 16,
                bottom: 8,
                width: isLandscape ? 520 : 340,
                maxWidth: '85vw',
                p: 4
            }}
        >
            {/* @ts-expect-error */}
        {ui.activeTool === 'timeline' && <EditorTimeline ui={ui} project={project} />}
        {/* plug in other panels later */}
        </Box>
      </Box>

      {/* RIGHT TOOL DOCK */}
      {/* <Box sx={{ position: 'absolute', top: 86, right: 14, zIndex: 20 }}>
        <Box
          sx={{
            p: 0.75,
            borderRadius: 999,
            border: '1px solid rgba(148,163,184,0.28)',
            bgcolor: 'rgba(2,6,23,0.55)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
          }}
        >
          <Stack spacing={1}>
            {toolDefs.map((t) => {
              const active = ui.activeTool === t.key;
              return (
                <Tooltip key={t.key} title={`${t.emoji} ${t.label}`} placement="left">
                  <IconButton
                    onClick={() => ui.setActiveTool(t.key)}
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: active
                        ? 'rgba(129,140,248,0.75)'
                        : 'rgba(148,163,184,0.22)',
                      bgcolor: active ? 'rgba(79,70,229,0.85)' : 'rgba(15,23,42,0.70)',
                      color: '#E5E7EB',
                      boxShadow: active ? '0 10px 24px rgba(79,70,229,0.35)' : 'none',
                      '&:hover': {
                        bgcolor: active ? 'rgba(79,70,229,0.95)' : 'rgba(30,41,59,0.80)',
                      },
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 900, lineHeight: 1 }}>
                      {t.emoji}
                      <Box component="span" sx={{ opacity: 0.9, ml: 0.35 }}>
                        {t.key.slice(0, 2).toUpperCase()}
                      </Box>
                    </Typography>
                  </IconButton>
                </Tooltip>
              );
            })}
          </Stack>
        </Box>
      </Box> */}

      <BottomToolBar
        toolDefs={toolDefs}
        activeTool={ui.activeTool}
        setActiveTool={ui.setActiveTool}
        onExit={() => navigate('/')} // or nav(-1)
      />

      {/* Small “active tool” toast */}
      <AnimatePresence>
        {ui.activeTool !== 'none' && (
          <Box
            component={motion.div}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            sx={{
              position: 'absolute',
              left: 16,
              bottom: 24,
              px: 1.25,
              py: 0.75,
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.18)',
              bgcolor: 'rgba(2,6,23,0.55)',
              color: 'rgba(226,232,240,0.92)',
              fontSize: 12,
              fontWeight: 900,
              backdropFilter: 'blur(10px)',
            }}
          >
            Active tool: {ui.activeTool}
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}
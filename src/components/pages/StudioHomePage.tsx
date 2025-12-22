
import { Badge, Breadcrumbs, Button, Chip, Container, ListItemText, Grid, Typography, Box, Card, CardContent, TextField, Tooltip } from "@mui/material"
import { InputAdornment } from "@mui/material"
import CopyIcon from "@mui/icons-material/CopyAll"
import { useMutation, useQuery } from "@tanstack/react-query"
import { queries } from "@api/index"
import { useParams, useLocation, useNavigate } from "react-router"
import { useEffect, useState } from "react"
import { encrypt, decrypt } from "@helpers/encrypt"
import { client } from "@api/index"
import { useUtilityStore } from "@store/utilityStore"
import { IntegrationForm } from "@components/custom/forms/premade/IntegrationForm"
import { useFilePicker } from "@components/custom/forms/useFilePicker"
import { MemoryCard2 } from "@components/custom/MemoryList"
import NotionIcon from "@mui/icons-material/NoteAdd"
import GitHubIcon from "@mui/icons-material/GitHub"
import EmailIcon from "@mui/icons-material/Email"
import SlackIcon from "@mui/icons-material/Map"
import { CardActions } from "@mui/material";
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { AttachFile, Close } from "@mui/icons-material"
import FormContainer from "@components/custom/forms/FormContainer"

const integrationsMeta = {
  notion: {
    name: "Notion",
    description: "Connect your Notion workspace to automatically save your memories from Notion.",
    image: NotionIcon,
    fields: [
      {
        name: "service",
        label: "Integration Type",
        dataType: "text",
        enumValues: ["notion"],
        defaultValue: "notion"
      },
      {
        name: "token",
        label: "API Token",
        fieldType: "password",
        dataType: "text",
      },
      {
        name: "database_id",
        label: "Database ID",
        dataType: "text"
      },
      {
        name: "page_id",
        label: "Page ID",
        dataType: "text"
      }
    ]
  },
  email: {
    name: "Gmail",
    description: "Connect your Gmail account to automatically save your memories from Gmail.",
    image: EmailIcon,
    fields: [
      {
        name: "service",
        label: "Integration Type",
        dataType: "text",
        enumValues: ["email"],
        defaultValue: "email"
      },
      {
        name: "webhook_url",
        label: "Webhook URL",
        fieldType: "url",
        dataType: "text",
        description: "Enter the webhook that delivers your emails to Memory.me"
      }
    ]
  },
  github: {
    name: "GitHub",
    description: "Connect your GitHub account to automatically save your memories from GitHub.",
    image: GitHubIcon
  }
};

export function IntegrationsGrid() {
    const utilityStore = useUtilityStore();
    const integrationsData = useQuery(queries.query(`/database/read_db/user_integrations`))
    console.log(integrationsData)
    const userIntegrations = integrationsData?.data?.data || [];

    const handleIntegrationForm = (integration: "notion" | "email") => {
        const config = integrationsMeta[integration];
        utilityStore.setModal({
        open: true,
        content: (
            <IntegrationForm
            userId={import.meta.env.VITE_ADMIN_USER_ID as string}
            columns={config.fields}
            onSubmit={(values) => {
                console.log("Integration form values:", values);
                // handleSubmit(values);
            }}
            />
        )
        });
    };

  const handleGithubConnect = () => {
    window.open(
      `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=http://localhost:5173/auth/callback/github`,
      "_blank"
    );
  };

  return (
    <Grid container spacing={4}>
      {(["notion", "email", "github"] as const).map((key) => {
        const [showToken, setShowToken] = useState(false);
        const item = integrationsMeta[key];
        const isConnected = userIntegrations.some((i: any) => i.service === key)
        return (
          <Grid size={{ xs: 12, md: 12, lg: 12 }} key={key}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
                <Grid container>
                    <Grid size={8}>
                        <CardContent>
                            <Typography variant="h4" gutterBottom>
                                {item.name}
                            </Typography>
                            <Typography variant="h6" gutterBottom>
                                Connect {item.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {item.description}
                            </Typography>
                        </CardContent>
                        <TextField 
                            type={showToken ? "text" : "password"} 
                            label="API Token" 
                            value={isConnected ? "Connected-token-is-here" : ""} 
                            fullWidth
                            sx={{ mb: 2 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment 
                                        onClick={() => setShowToken(!showToken)}
                                        position="end" 
                                        sx={{ cursor: "pointer", color: "inherit" }}
                                    >
                                        {showToken ? <FaEye /> : <FaEyeSlash />}
                                    </InputAdornment>
                                )
                            }}
                        />
                        <CardActions>
                            <Button
                                variant={isConnected ? "contained" : "outlined"}
                                // color={isConnected ? "success" : "primary"}
                                color="inherit"
                                fullWidth
                                disabled={isConnected}
                                onClick={() => handleIntegrationForm(key as "notion" | "email")}
                            >
                                {isConnected ? "Connected" : "Connect"}
                            </Button>
                            {isConnected ? (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    fullWidth
                                    onClick={() => {
                                        
                                    }}
                                >
                                    Disconnect
                                </Button>
                            ) : null}
                        </CardActions>
                        {isConnected && (
                            <Chip 
                            label="Connected"
                            color="success"
                            size="small"
                            sx={{ position: "absolute", top: 12, right: 12 }}
                            />
                        )}
                        {['gmail', 'github'].includes(item.name.toLowerCase()) && (
                        //(item.name.toLowerCase() === "gmail") && (
                            <>
                            <Tooltip title="What is a webhook?">
                                <Badge
                                    badgeContent="?"
                                    sx={{ my: 2}}
                                    // label="Webhook URL"
                                    // color="success"
                                    // sx={{ position: "absolute", top: 12, right: 12 }}
                                >
                                    <Typography variant="body2" color="text.secondary" px={2}>
                                        Webhook URL:
                                    </Typography>
                                </Badge>
                            </Tooltip>

                            <TextField
                                // label="Webhook URL"
                                value={`https://memory.me/api/${item.name.toLowerCase()}/webhook/` + import.meta.env.VITE_ADMIN_USER_ID}
                                fullWidth
                                sx={{ mb: 2 }}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <InputAdornment 
                                            position="end" 
                                            sx={{ cursor: "pointer", color: "inherit" }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(`https://memory.me/api/${item.name.toLowerCase()}/webhook/` + import.meta.env.VITE_ADMIN_USER_ID);
                                            }}
                                        >
                                            <CopyIcon color="inherit" />
                                        </InputAdornment>
                                    )   
                                }}
                                // value={integrationId}
                                // onChange={(e) => setIntegrationId(e.target.value)}
                            />
                            </>
                        )}
                        {(item.name.toLowerCase() === "notion") && (
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    label="Page ID/s"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    sx={{ mb: 2 }}
                                    // value={integrationId}
                                    // onChange={(e) => setIntegrationId(e.target.value)}
                                />
                                <TextField
                                    label="Database ID/s"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    sx={{ mb: 2 }}
                                    // value={integrationId}
                                    // onChange={(e) => setIntegrationId(e.target.value)}
                                />
                                {/* <Button
                                    variant="outlined"
                                    color="primary"
                                    fullWidth
                                    sx={{ mb: 1 }}
                                    onClick={() => {
                                        
                                    }}
                                >
                                    Generate Webhook URL
                                </Button> */}
                                <Typography variant="body2" color="text.secondary" px={2}>
                                    Webhook URL:
                                </Typography>
                                <TextField
                                    // label="Webhook URL"
                                    value={"https://memory.me/api/notion/webhook/" + import.meta.env.VITE_ADMIN_USER_ID}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment 
                                                position="end" 
                                                sx={{ cursor: "pointer", color: "inherit" }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText("https://memory.me/api/notion/webhook/" + import.meta.env.VITE_ADMIN_USER_ID);
                                                }}
                                            >
                                                <CopyIcon color="inherit" />
                                            </InputAdornment>
                                        )   
                                    }}
                                    // value={integrationId}
                                    // onChange={(e) => setIntegrationId(e.target.value)}
                                />
                            </Box>
                        )}
                        <Button
                            variant="outlined"
                            color="inherit"
                            fullWidth
                            onClick={() => setShowToken(!showToken)}
                        >
                            Save
                        </Button>
                    </Grid>
                    <Grid size={4}>
                        {/* @ts-ignore */}
                        <Box
                            component="img"
                            src={item.image}
                            alt={`${item.name} Logo`}
                            sx={{ width: "100%", height: 160, objectFit: "cover" }}
                        />
                    </Grid>
                </Grid>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export const IntegrationButtons = () => {
    const utilityStore = useUtilityStore();
    const createMemoryMutation = useMutation(queries.mutate("/api/v1/guardian/create-memory"));
    const createIntegrationMutation = useMutation(queries.mutate("/api/v1/guardian/create-integration"));
    const { openFilePicker, FileInput } = useFilePicker((files) => {
        console.log(files);
    });

    const handleSubmit = async (values: any) => {
        console.log(values);
        if (Object.keys(values.value).some(key => !values.value[key])) {
            utilityStore.createAlert("error", "Please fill out all fields")
            return;
        };

        const sensitive = {
            ...values.value,
            "user_id": import.meta.env.VITE_ADMIN_USER_ID
        };

        const { ciphertext, iv, tag } = await encrypt(
            JSON.stringify(sensitive),
            import.meta.env.VITE_MEMORY_ENCRYPTION_KEY
        );
      
        const encryptedPayload = {
            user_id: import.meta.env.VITE_ADMIN_USER_ID,
            service: values.value.service,
            encrypted_token: ciphertext,
            iv,
            auth_tag: tag
        };
        createIntegrationMutation
            .mutate(
                encryptedPayload,
                {
                    onSuccess: (data) => {
                        console.log(data);
                        utilityStore.createAlert("success", "Integration created successfully")
                        utilityStore.setModal({ open: false, content: null })
                    },
                    onError: (error) => {
                        console.log(error);
                        utilityStore.createAlert("error", "Failed to create integration")
                    }
                }
            )
    };

    const handleIntegrationForm = async (integration: string) => {
        const columns = {
            "notion": [
            {
                name: "service",
                // @ts-ignore
                label: "Integration Type",
                dataType: "text",
                enumValues: ["notion", "github", "stripe"],
                defaultValue: integration
            },
            {
                name: "token",
                // @ts-ignore
                label: "API Token",
                type: "text",
                fieldType: "password",
                dataType: "text",
                description: "Enter your integration token (will be encrypted)"
            },
            {
                name: "database_id",
                // @ts-ignore
                label: "Database ID",
                dataType: "text"
            },
            {
                name: "page_id",
                // @ts-ignore
                label: "Page ID",
                dataType: "text"
            },
        ],
        "email": [
            {
                name: "service",
                // @ts-ignore
                label: "Integration Type",
                dataType: "text",
                enumValues: ["notion", "github", "stripe", "email", "slack"]
            },
            {
                name: "webhook_url",
                // @ts-ignore
                label: "Webhook URL",
                type: "text",
                fieldType: "url",
                dataType: "text",
                description: "Enter your integration webhook URL. Instructions for setting up can be found here 👉 [Gmail App Scripts](https://developers.google.com/apps-script/quickstart/gmail)"
            }
        ]
        }[integration]
        utilityStore.setModal({
            open: true,
            content: <IntegrationForm 
                userId={import.meta.env.VITE_ADMIN_USER_ID as string} 
                columns={columns}
                onSubmit={(values) => {
                    console.log(values);
                    handleSubmit(values);
                }}
            />
        })
    }
    return (
        <Grid container spacing={2} mt={2}>
            <Button 
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => {
                    window.open("https://github.com/login/oauth/authorize?client_id=" + import.meta.env.VITE_GITHUB_CLIENT_ID + "&redirect_uri=" + "http://localhost:5173/auth/callback/github", "_blank");
                }}
            >
                GitHub
            </Button>
            <Typography variant="body2" color="text.secondary">Create Memories from GitHub Commits</Typography>
            <Button variant="outlined" onClick={() => createMemoryMutation.mutate({
                "user_id": import.meta.env.VITE_ADMIN_USER_ID,
                "service": "github",
                "details": {
                    "repo": "",
                    "branch": "main",
                    "commit_id": ""
                }
            })}>Create Memory</Button>
            <Button variant="outlined">Schedule</Button>
            <Button 
                variant="outlined" 
                color="primary" 
                fullWidth 
                onClick={() => handleIntegrationForm("notion")}
            >
                Notion
            </Button>
            <Button 
                variant="outlined" 
                color="primary" 
                fullWidth 
                onClick={() => handleIntegrationForm("email")}
            >
                Email
            </Button>
            <Button 
                variant="outlined" 
                color="primary" 
                fullWidth 
                onClick={() => handleIntegrationForm("slack")}
            >
                Slack
            </Button>
            {FileInput}
        </Grid>
    )
}

const DecryptedMemoriesSection = ({ showAll }: { showAll?: boolean }) => {
    type EncryptedMemory = {
        id: string;
        trace_id: string;
        encrypted_data: string;
        iv: string;
        tag: string;
    };
    type DecryptedMemory = {
        id: string;
        trace_id: string;
        content: any;
    };
    const path = "/database/read_db/encrypted_memories?user_id=" + import.meta.env.VITE_ADMIN_USER_ID;
    const encryptedMemoriesQuery = useQuery(queries.query(path));
    const encryptedMemories = encryptedMemoriesQuery.data?.data || [];
    const [decryptedMemories, setDecryptedMemories] = useState<DecryptedMemory[]>([]);
    useEffect(() => {
        if (!encryptedMemoriesQuery.data) return;
        (async () => {
            const decryptedMemories = await Promise.all(
                encryptedMemories.map(async (mem: EncryptedMemory) => {
                    try {
                        const plaintext = await decrypt(
                            mem.encrypted_data,
                            mem.iv,
                            mem.tag,
                            import.meta.env.VITE_MEMORY_ENCRYPTION_KEY // base64 string
                        );
                
                        return {
                            ...mem,
                            content: JSON.parse(plaintext) // if you encrypted JSON
                        };
                    } catch (err) {
                        console.error("Failed to decrypt memory", mem.id, err);
                        return { ...mem, content: null };
                    }
                })
            );
            setDecryptedMemories(decryptedMemories);
        })();
    }, [encryptedMemories]);
    return (
        <Grid container spacing={2}>
                {decryptedMemories
                    // TODO: Add Pagination
                    .reverse()
                    .slice(0, showAll ? decryptedMemories.length : 8)
                    // ...
                    .map((memory: DecryptedMemory) => (
                        <Grid 
                            key={memory.trace_id}
                            size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 2 }} 
                        >
                            <MemoryCard2 memory={memory.content} />
                        </Grid>
                    ))
                }
        </Grid>
    )
};

export const MemoriesPage = () => {
    const utilityStore = useUtilityStore();
    return (
        <Container maxWidth="lg">
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <ListItemText primary={
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        All Memories
                    </Typography>
                } secondary="AES-256-GCM Encrypted" />
                <Box sx={{ display: "flex", gap: 2, mt: 1, height: 50 }}>
                    <Button 
                        variant="outlined" 
                        color="inherit" 
                        size="small"
                        onClick={() => utilityStore.setModal({
                            open: true,
                            content: <FormContainer
                                schema={{
                                    table: "memory",
                                    columns: [
                                        {
                                            dataType: "text",
                                            name: "Title"
                                        },
                                        {
                                            dataType: "text",
                                            name: "Content"
                                        },
                                        {
                                            dataType: "attachment",
                                            name: "Attachment"
                                        }
                                    ]
                                }}
                                handleCancelClick={() => utilityStore.setModal({ open: false })}
                                handleSubmit={(values: any) => {
                                    console.log(values);
                                    alert(`Memory created successfully, ${JSON.stringify(values.value, null, 2)}`);
                                    utilityStore.setModal({ open: false, content: null })
                                }}
                            />
                        })}
                    >
                        ☁️ Create Memory
                    </Button>
                </Box>
            </Box>
            <DecryptedMemoriesSection showAll />
        </Container>
    )
}

const IntegrationsPage = () => {
    const navigate = useNavigate();
    const encryptedMemoriesQuery = useQuery(queries.query("/database/read_db/encrypted_memories?user_id=" + import.meta.env.VITE_ADMIN_USER_ID))
    const utilityStore = useUtilityStore();
    
    const [decryptedMemories, setDecryptedMemories] = useState<any[]>([]);
    const encryptedMemories = encryptedMemoriesQuery.data?.data || [];

    useEffect(() => {
        if (!encryptedMemoriesQuery.data) return;
        (async () => {
            const decryptedMemories = await Promise.all(
                encryptedMemories.map(async (mem: any) => {
                  try {
                    const plaintext = await decrypt(
                      mem.encrypted_data,
                      mem.iv,
                      mem.tag,
                      import.meta.env.VITE_MEMORY_ENCRYPTION_KEY // base64 string
                    );
              
                    return {
                      ...mem,
                      content: JSON.parse(plaintext) // if you encrypted JSON
                    };
                  } catch (err) {
                    console.error("Failed to decrypt memory", mem.id, err);
                    return { ...mem, content: null };
                  }
                })
              );
              setDecryptedMemories(decryptedMemories);
              console.log("decryptedMemories: ", decryptedMemories)
        })();
    }, [encryptedMemories]);

    useEffect(() => {
        (async () => {
            const code = new URLSearchParams(window.location.search).get("code");
            if (!code) return;
            await client.post("/api/v1/auth/callback", {
                "service": "github",
                "user_id": import.meta.env.VITE_ADMIN_USER_ID,
                "code": code
            });
        })();
    }, [])
    
    return (
        <Container maxWidth="lg">
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <ListItemText primary={
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Recent Memories <Chip size="small" label={decryptedMemories.length} />
                    </Typography>
                } secondary="AES-256-GCM Encrypted" />
                <Box sx={{ display: "flex", gap: 2, mt: 1, height: 50 }}>
                    <Button 
                        variant="outlined" 
                        color="inherit" 
                        size="small"
                        onClick={() => navigate("/memories")}
                    >
                        ✨ View All
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="inherit" 
                        size="small"
                        onClick={() => utilityStore.setModal({
                            open: true,
                            content: <>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography variant="h6">
                                    Create Memory
                                </Typography>
                                <Button
                                    color="inherit" 
                                    size="small"
                                    onClick={() => utilityStore.setModal({ open: false })}
                                >
                                    <Close />
                                </Button>
                            </Box>
                            <FormContainer
                                disableHeader
                                schema={{
                                    table: "memory",
                                    columns: [
                                        {
                                            dataType: "text",
                                            name: "Title"
                                        },
                                        {
                                            dataType: "text",
                                            name: "Content"
                                        },
                                        {
                                            dataType: "attachment",
                                            name: "Attachment"
                                        }
                                    ]
                                }}
                                handleCancelClick={() => utilityStore.setModal({ open: false })}
                                handleSubmit={(values: any) => {
                                    console.log(values);
                                    alert(`Memory created successfully, ${JSON.stringify(values.value, null, 2)}`);
                                    utilityStore.setModal({ open: false, content: null })
                                }}
                            />
                            </>
                        })}
                    >
                        ☁️ Create Memory
                    </Button>
                </Box>
            </Box>
            <DecryptedMemoriesSection />
            <Grid size={12} sx={{ textAlign: "right", justifyContent: "flex-end" }}>
                <Breadcrumbs
                    aria-label="breadcrumb"
                    separator="|"
                    // separator={<NavigateBeforeIcon fontSize="small" />}
                >
                    <Typography variant="body2" color="text.secondary">Page 1</Typography>
                    <Typography variant="body2" color="text.secondary">Page 2</Typography>
                </Breadcrumbs>
            </Grid>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Integrations
                </Typography>
                <Button variant="outlined" color="inherit" onClick={() => navigate("/integrations")}>
                    🔌 Connect more services
                </Button>
            </Box>
            <hr />
            <Grid container spacing={2}>
                {[
                    { 
                        icon: <NotionIcon />,
                        service: "notion", description: "Connect your Notion account to create memories from your Notion pages" },
                    { 
                        icon: <GitHubIcon />,
                        service: "github", description: "Connect your GitHub account to create memories from your GitHub commits" },
                    { 
                        icon: <EmailIcon />,
                        service: "email", description: "Connect your email account to create memories from your emails" },
                    { 
                        icon: <SlackIcon />,
                        service: "slack", description: "Connect your Slack account to create memories from your Slack messages" }
                ].map((connectedService: any) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 2 }} key={connectedService.service}>
                        <Card>
                            <CardContent>
                                <Box alignItems="center" >
                                    {connectedService.icon}
                                    <Typography variant="h5">{connectedService.service}</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">{connectedService.description}</Typography>
                                <ListItemText
                                    primary={"Connected" + " " + new Date().toLocaleDateString()}
                                    secondary={"Last Synced: " + new Date().toLocaleDateString()}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    )
}


import React from "react";
import {
  IconButton,
  Paper,
  Stack,
} from "@mui/material";
import { motion } from "framer-motion";

import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import MovieCreationOutlinedIcon from "@mui/icons-material/MovieCreationOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

type TabKey = "studio" | "image" | "editor" | "feed" | "profile" | "settings";

export function StudioHomePage() {
  const nav = useNavigate();

  // stub: swap to your real state
  const activeTab: TabKey = "studio";
  const isSynced = true;

  const handleNewVideoProject = () => {
    // create project then route; for now just go somewhere
    nav("/editor/new?type=video");
  };

  const handleNewImageProject = () => {
    nav("/editor/new?type=image");
  };

  const handleOpenProject = (id: string) => {
    nav(`/editor/${id}`);
  };

  const handleSyncNow = async () => {
    // call your sync action
    console.log("sync now");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "#E5E7EB",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* subtle background glow */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        sx={{
          position: "absolute",
          inset: -220,
          background:
            "radial-gradient(circle at 30% 10%, rgba(99,102,241,0.25), transparent 45%), radial-gradient(circle at 70% 20%, rgba(34,197,94,0.12), transparent 48%), radial-gradient(circle at 55% 85%, rgba(236,72,153,0.10), transparent 52%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      <Container
        maxWidth="sm"
        sx={{
          pt: 2,
          pb: 12, // leave room for bottom dock
          position: "relative",
        }}
      >
        {/* Top bar */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            <Typography sx={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.2 }}>
              Studio Editor 🏀⛹️
            </Typography>

            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: 999,
                bgcolor: isSynced ? "#22c55e" : "#f59e0b",
                boxShadow: isSynced
                  ? "0 0 0 3px rgba(34,197,94,0.15)"
                  : "0 0 0 3px rgba(245,158,11,0.15)",
              }}
              aria-label={isSynced ? "synced" : "not synced"}
            />
          </Stack>

          <Button
            onClick={handleSyncNow}
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            variant="contained"
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 800,
              bgcolor: "#4F46E5",
              px: 2,
              py: 0.8,
              "&:hover": { bgcolor: "#4338CA" },
            }}
          >
            Sync now
          </Button>
        </Stack>

        {/* Tagline */}
        <Typography sx={{ color: "rgba(148,163,184,0.85)", mb: 2, fontSize: 13 }}>
          Make something cool today
        </Typography>

        {/* Actions */}
        <Stack gap={1.25} sx={{ mb: 2.25 }}>
          <ActionPill
            label="New Video Project"
            onClick={handleNewVideoProject}
          />
          <ActionPill
            label="New Image Project"
            onClick={handleNewImageProject}
          />
        </Stack>

        {/* Project card */}
        <Paper
          component={motion.div}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          elevation={0}
          onClick={() => handleOpenProject("proj-1")}
          sx={{
            cursor: "pointer",
            borderRadius: 3,
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(2,6,23,0.65)",
            backdropFilter: "blur(10px)",
            overflow: "hidden",
            px: 1.25,
            py: 1.1,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            "&:hover": {
              borderColor: "rgba(129,140,248,0.55)",
              background: "rgba(2,6,23,0.78)",
            },
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 38,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(15,23,42,0.70))",
              border: "1px solid rgba(148,163,184,0.14)",
            }}
          >
            <Typography sx={{ fontSize: 20, opacity: 0.95 }}>🎬</Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.2 }}>
              Project 1
            </Typography>
            <Typography sx={{ color: "rgba(148,163,184,0.75)", fontSize: 12, mt: 0.3 }}>
              Edited Nov 17
            </Typography>
          </Box>

          <Chip
            size="small"
            label="Video"
            sx={{
              bgcolor: "rgba(79,70,229,0.16)",
              color: "#C7D2FE",
              border: "1px solid rgba(129,140,248,0.28)",
              fontWeight: 800,
            }}
          />
        </Paper>
      </Container>

      {/* Bottom dock */}
      <BottomDock active={activeTab} onSelect={(t) => nav(tabToRoute(t))} />
    </Box>
  );
}

function ActionPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      component={motion.button}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      fullWidth
      variant="contained"
      sx={{
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 800,
        py: 1.25,
        bgcolor: "rgba(15,23,42,0.85)",
        color: "#E5E7EB",
        border: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
        "&:hover": {
          bgcolor: "rgba(30,41,59,0.92)",
          borderColor: "rgba(129,140,248,0.45)",
        },
      }}
    >
      {label}
    </Button>
  );
}

function BottomDock({
  active,
  onSelect,
}: {
  active: TabKey;
  onSelect: (t: TabKey) => void;
}) {
  const items: { key: TabKey; icon: React.ReactNode; label: string }[] = [
    { key: "studio", icon: <CameraAltOutlinedIcon fontSize="small" />, label: "Studio" },
    { key: "image", icon: <ImageOutlinedIcon fontSize="small" />, label: "Image" },
    { key: "editor", icon: <VideocamOutlinedIcon fontSize="small" />, label: "Editor" },
    { key: "feed", icon: <AutoAwesomeOutlinedIcon fontSize="small" />, label: "Feed" },
    { key: "profile", icon: <PersonOutlineOutlinedIcon fontSize="small" />, label: "Profile" },
    { key: "settings", icon: <SettingsOutlinedIcon fontSize="small" />, label: "Settings" },
  ];

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        px: 1.25,
        pb: 1.25,
        zIndex: 20,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          mx: "auto",
          maxWidth: 720,
          borderRadius: 3,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(2,6,23,0.72)",
          backdropFilter: "blur(10px)",
          px: 1,
          py: 0.75,
        }}
      >
        <Stack direction="row" justifyContent="space-around" alignItems="center">
          {items.map((it) => {
            const isActive = it.key === active;
            return (
              <Box key={it.key} sx={{ width: 84, textAlign: "center" }}>
                <IconButton
                  onClick={() => onSelect(it.key)}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    color: isActive ? "#E0E7FF" : "rgba(148,163,184,0.9)",
                    bgcolor: isActive ? "rgba(79,70,229,0.22)" : "transparent",
                    border: isActive ? "1px solid rgba(129,140,248,0.35)" : "1px solid transparent",
                    "&:hover": {
                      bgcolor: isActive ? "rgba(79,70,229,0.28)" : "rgba(15,23,42,0.55)",
                    },
                  }}
                >
                  {it.icon}
                </IconButton>
                <Typography
                  sx={{
                    mt: 0.4,
                    fontSize: 11,
                    fontWeight: isActive ? 900 : 700,
                    color: isActive ? "#E5E7EB" : "rgba(148,163,184,0.75)",
                  }}
                >
                  {it.label}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Paper>
    </Box>
  );
}

function tabToRoute(t: TabKey) {
  switch (t) {
    case "studio":
      return "/";
    case "image":
      return "/image";
    case "editor":
      return "/editor";
    case "feed":
      return "/feed";
    case "profile":
      return "/profile";
    case "settings":
      return "/settings";
    default:
      return "/";
  }
}

export default StudioHomePage
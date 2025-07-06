import { useState } from 'react';
import './App.css';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';

function App() {
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8080/api/email/generate', {
        emailContent,
        tone,
      });
      setGeneratedReply(
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
      );
    } catch (err) {
      setError('Failed to generate email reply. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h3" component="h1" gutterBottom textAlign="center">
        Email Reply Generator
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 2, sm: 5 } }}>
        <TextField
          label="Original Email Content"
          multiline
          rows={6}
          variant="outlined"
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel id="tone-label">Tone (Optional)</InputLabel>
          <Select
            labelId="tone-label"
            label="Tone (Optional)"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="casual">Casual</MenuItem>
            <MenuItem value="friendly">Friendly</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!emailContent || loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Reply'}
        </Button>

        {error && (
          <Typography color="error" variant="body2" textAlign="center">
            {error}
          </Typography>
        )}

        {generatedReply && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Generated Reply:
            </Typography>
            <TextField
              multiline
              rows={6}
              variant="outlined"
              value={generatedReply}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigator.clipboard.writeText(generatedReply)}
              fullWidth
            >
              Copy to Clipboard
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default App;



// import { useState } from 'react';
// import './App.css';

// function App() {
//   const [emailContent, setEmailContent] = useState('');
//   const [tone, setTone] = useState('');
//   const [generatedReply, setGeneratedReply] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const response = await fetch('http://localhost:8080/api/email/generate', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ emailContent, tone }),
//       });
//       const data = await response.text();
//       setGeneratedReply(data);
//     } catch (err) {
//       setError('Failed to generate email reply. Please try again.');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container">
//       <h1>Email Reply Generator</h1>

//       <textarea
//         placeholder="Enter original email content..."
//         value={emailContent}
//         onChange={(e) => setEmailContent(e.target.value)}
//         rows="8"
//         className="textarea"
//       ></textarea>

//       <label htmlFor="tone">Tone (Optional):</label>
//       <select
//         id="tone"
//         value={tone}
//         onChange={(e) => setTone(e.target.value)}
//         className="select"
//       >
//         <option value="">None</option>
//         <option value="professional">Professional</option>
//         <option value="casual">Casual</option>
//         <option value="friendly">Friendly</option>
//       </select>

//       <button
//         onClick={handleSubmit}
//         disabled={!emailContent || loading}
//         className="button"
//       >
//         {loading ? 'Generating...' : 'Generate Reply'}
//       </button>

//       {error && <p className="error">{error}</p>}

//       {generatedReply && (
//         <div className="result">
//           <h3>Generated Reply:</h3>
//           <textarea
//             readOnly
//             value={generatedReply}
//             rows="8"
//             className="textarea"
//           ></textarea>
//           <button
//             onClick={() => navigator.clipboard.writeText(generatedReply)}
//             className="button-outline"
//           >
//             Copy to Clipboard
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;

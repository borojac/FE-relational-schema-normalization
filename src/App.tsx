import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Box, TextField,
  IconButton, Button, Autocomplete, Chip,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { FunctionalDependency, FunctionalDependencySet, RelationalScheme, Utils } from 'relational-schema-normalization';

const parseAttributes = (schema: string) => {
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]*(,\s*[a-zA-Z_][a-zA-Z0-9_]*)*$/;
  if (!regex.test(schema)) {
    return null;
  }
  return schema.split(',').map(attr => attr.trim()).filter(Boolean);
};

const SCHEMA_KEY = 'relationalSchema';
const DEPENDENCIES_KEY = 'functionalDependencies';

const FunctionalDependenciesApp: React.FC = () => {
  const [schema, setSchema] = useState('');
  const [attributes, setAttributes] = useState<string[]>([]);
  const [dependencies, setDependencies] = useState<{ from: string[], to: string[] }[]>([]);
  const [schemaError, setSchemaError] = useState(false);
  const [resultText, setResultText] = useState<string>('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedSchema = localStorage.getItem(SCHEMA_KEY);
    const savedDependencies = localStorage.getItem(DEPENDENCIES_KEY);

    if (savedSchema) {
      setSchema(savedSchema);
      const parsedAttributes = parseAttributes(savedSchema);
      if (parsedAttributes) {
        setAttributes(parsedAttributes);
      }
    }

    if (savedDependencies) {
      setDependencies(JSON.parse(savedDependencies));
    }
    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(SCHEMA_KEY, schema);
  }, [schema]);

  useEffect(() => {
    localStorage.setItem(DEPENDENCIES_KEY, JSON.stringify(dependencies));
  }, [dependencies])

  useEffect(() => {
    if (isDataLoaded) {
      const cleanDependencies = dependencies.filter(dep =>
        dep.from.every(attr => attributes.includes(attr)) &&
        dep.to.every(attr => attributes.includes(attr))
      );

      if (JSON.stringify(cleanDependencies) !== JSON.stringify(dependencies)) {
        setDependencies(cleanDependencies);
      }
    }
  }, [attributes, isDataLoaded]);

  const handleSchemaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSchema(value);

    const parsedAttributes = parseAttributes(value);
    const uniqueAttributes = new Set(parsedAttributes);

    if (parsedAttributes && uniqueAttributes.size !== parsedAttributes.length) {
      setSchemaError(true)
    }
    else if (parsedAttributes) {
      setAttributes(parsedAttributes);
      setSchemaError(false);
    } else {
      setSchemaError(true);
    }
  };

  const handleAddDependency = () => {
    setDependencies([...dependencies, { from: [], to: [] }]);
  };

  const handleDeleteDependency = (index: number) => {
    const newDependencies = [...dependencies];
    newDependencies.splice(index, 1);
    setDependencies(newDependencies);
  };

  const handleFromChange = (index: number, value: string[]) => {
    const newDependencies = [...dependencies];
    newDependencies[index].from = value;
    setDependencies(newDependencies);
  };

  const handleToChange = (index: number, value: string[]) => {
    const newDependencies = [...dependencies];
    newDependencies[index].to = value;
    setDependencies(newDependencies);
  };

  const loadRelationalSchemeAndFunctionalDependencies = (): [RelationalScheme, FunctionalDependencySet] => {
    return [new RelationalScheme(attributes), new FunctionalDependencySet(
      dependencies.map(dependency => new FunctionalDependency(new Set<string>(dependency.from), new Set<string>(dependency.to)))
    )]
  }

  const setOfAttributesToString = (attrs: Set<string>): string => {
    let result: string = '{';
    let attrsArr = [...attrs];
    for (let i = 0; i < attrsArr.length - 1; i++) {
      result += attrsArr[i] + ',';
    }
    result += attrsArr[attrsArr.length - 1] + '}';
    return result;
  }

  const handleButton1Click = () => { // candidate keys
    setLoading(true);
    const [relationalScheme, fds]: [RelationalScheme, FunctionalDependencySet] = loadRelationalSchemeAndFunctionalDependencies();
    setTimeout(() =>{

      const candidateKeys = Utils.computeCandidateKeys(relationalScheme, fds);
      
      let resultText = '';
      
      candidateKeys.forEach(candidateKey => resultText += `\u2022${setOfAttributesToString(candidateKey)}\n`);
      
      setResultText(resultText);
      setLoading(false);
    }, 500);
  };

  const handleButton2Click = () => { // attributes closure
    setLoading(true);
    const [relationalScheme, fds]: [RelationalScheme, FunctionalDependencySet] = loadRelationalSchemeAndFunctionalDependencies();
    setTimeout(() => {
      const subsets: Set<string>[] = Utils.generateSubsets(relationalScheme.attributes);
      
      let resultText = '';
      
      subsets.forEach(subset => resultText += `\u2022${setOfAttributesToString(subset)}\u207A \u2192 ${setOfAttributesToString(Utils.closureOfSetOfAttributes(subset, fds))}\n`);
      
      setResultText(resultText);
      setLoading(false);
    }, 500);
  };

  const handleButton3Click = () => { // functional dependencies closure
    setLoading(true);
    const [relationalScheme, fds]: [RelationalScheme, FunctionalDependencySet] = loadRelationalSchemeAndFunctionalDependencies();
    setTimeout(() => {
      let resultText = '';
      
      const fdsClosure = Utils.closureOfSetOfFunctionalDependenciesUsingAttributesClosure(relationalScheme, fds);
      
      fdsClosure.fdArray.forEach(fd => resultText += `\u2022${setOfAttributesToString(fd.determinant)} \u2192 ${setOfAttributesToString(fd.dependent)}\n`)
      
      setResultText(resultText);
      setLoading(false);
    }, 500);
  };

  const handleButton4Click = () => { // minimal cover
    setLoading(true);
    const [relationalScheme, fds]: [RelationalScheme, FunctionalDependencySet] = loadRelationalSchemeAndFunctionalDependencies();
    setTimeout(() => {
      let resultText = '';
      
      const fdsMinimal = Utils.computeMinimalCover(fds);
      console.log(fdsMinimal);
      fdsMinimal.fdArray.forEach(fd => resultText += `\u2022${setOfAttributesToString(fd.determinant)} \u2192 ${setOfAttributesToString(fd.dependent)}\n`)
      
      setResultText(resultText);
      setLoading(false);
    }, 500);
  };

  const handleButton5Click = () => { // 3NF
    setLoading(true);
    const [relationalScheme, fds]: [RelationalScheme, FunctionalDependencySet] = loadRelationalSchemeAndFunctionalDependencies();
    setTimeout(() => {

      let resultText = '';
      
      const rs3nf: RelationalScheme[] = Utils.syntesisAlgorithmFor3NF(relationalScheme, fds);
      
      rs3nf.forEach(rs => resultText += `\u2022${setOfAttributesToString(rs.attributes)}\n`)
      
      setResultText(resultText);
      setLoading(false);
    }, 500);
  };

  const handleButton6Click = async () => { // BCNF
    setLoading(true);
    const [relationalScheme, fds]: [RelationalScheme, FunctionalDependencySet] = loadRelationalSchemeAndFunctionalDependencies();

    setTimeout(() => {

      let resultText = '';
      
      const rs3nf: RelationalScheme[] = Utils.bcnfDecomposition(relationalScheme, fds);
      
      rs3nf.forEach(rs => resultText += `\u2022${setOfAttributesToString(rs.attributes)}\n`)
      
      setResultText(resultText);
      setLoading(false);
    }, 500)
  };

  const isButtonDisabled = schemaError || attributes.length === 0 || dependencies.length === 0 || dependencies.some(dep => dep.from.length === 0 || dep.to.length === 0);

  return (
    <div>
      {loading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',  // Semi-transparent background
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 13000,  // Make sure it overlays everything
        }}>
          <CircularProgress size={80} />  {/* You can adjust the size of the loader */}
        </Box>
      )}
      {/* AppBar (Header) */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Functional Dependencies Editor
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Container>
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Enter attributes of the relational schema (comma-separated):
          </Typography>
          <TextField
            fullWidth
            label="Relational Schema"
            variant="outlined"
            value={schema}
            onChange={handleSchemaChange}
            error={schemaError}
            helperText={schemaError ? "Invalid format. Use comma-separated attribute names (e.g., A, B, C)." : "Example: A, B, C, D"}
          />

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Define Functional Dependencies:
            </Typography>

            {dependencies.map((dependency, index) => (
              <Box
                key={index}
                display="flex"
                alignItems="center"
                sx={{
                  mb: 2,
                  flexDirection: { xs: 'column', sm: 'row' }, // stack on mobile, row on larger screens
                  width: '100%',
                  gap: 2,
                }}
              >
                {/* FROM */}
                <Autocomplete
                  multiple
                  options={attributes}
                  value={dependency.from}
                  onChange={(event, newValue) => handleFromChange(index, newValue)}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} key={index} />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="From" variant="outlined" />}
                  sx={{ width: { xs: '100%', sm: '40%' }, mr: { sm: 2 } }}
                />

                {/* Arrow Icon */}
                <ArrowRightAltIcon sx={{ display: { xs: 'none', sm: 'inline-block' } }} />

                {/* TO */}
                <Autocomplete
                  multiple
                  options={attributes}
                  value={dependency.to}
                  onChange={(event, newValue) => handleToChange(index, newValue)}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} key={index} />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="To" variant="outlined" />}
                  sx={{ width: { xs: '100%', sm: '40%' }, ml: { sm: 2 } }}
                />

                {/* Delete Button */}
                <IconButton onClick={() => handleDeleteDependency(index)} sx={{ ml: { sm: 2 }, mt: { xs: 2, sm: 0 } }}>
                  <DeleteIcon color="error" />
                </IconButton>
              </Box>
            ))}

            {/* Add Another Dependency */}
            <Button
              variant="contained"
              color="error"
              onClick={handleAddDependency}
              sx={{ mt: 2, width: { xs: '100%', sm: 'auto' } }} // Full width button on mobile
            >
              Add Another Dependency
            </Button>

            {/* Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleButton1Click}
                disabled={isButtonDisabled}  // Dugme je disabled ako nema atributa ili zavisnosti
              >
                Candidate keys
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleButton2Click}
                disabled={isButtonDisabled}  // Isto za drugo dugme
              >
                Attributes closure
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleButton3Click}
                disabled={isButtonDisabled}  // Isto za treće dugme
              >
                Functional Dependency closure
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleButton4Click}
                disabled={isButtonDisabled}  // Isto za četvrto dugme
              >
                Minimal cover
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleButton5Click}
                disabled={isButtonDisabled}  // Isto za četvrto dugme
              >
                3NF
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleButton6Click}
                disabled={isButtonDisabled}  // Isto za četvrto dugme
              >
                BCNF
              </Button>
            </Box>


            {/* Display result below the buttons */}
            {resultText && (
              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="body1"
                  component="div"
                  sx={{
                    fontSize: '1.2rem',  // Povećan font
                    fontFamily: 'Consolas, "Courier New", monospace',  // Monospaced fontovi za coding stil
                    whiteSpace: 'pre-wrap',  // Osigurava da se tekst lepo formatira u više redova ako je potrebno
                    fontWeight: 550,
                  }}
                >
                  {resultText}
                </Typography>
              </Box>
            )}

          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default FunctionalDependenciesApp;

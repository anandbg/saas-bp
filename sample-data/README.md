# Sample Data for Radiology Reporting App

This directory contains sample data for testing and development of the Radiology Reporting App. Use this data to verify that all features are working correctly after setup.

## 📋 Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Sample Findings](#sample-findings)
- [Sample Templates](#sample-templates)
- [Sample Audio Files](#sample-audio-files)
- [Database Seed Data](#database-seed-data)
- [Usage Instructions](#usage-instructions)
- [Testing Scenarios](#testing-scenarios)

---

## 🎯 Overview

The sample data provided here covers:

- **Clinical Findings**: Realistic radiology findings for various scan types
- **Templates**: Pre-built report templates for common scan types
- **Audio Files**: Sample dictations for transcription testing
- **Database Seeds**: SQL scripts to populate initial data
- **Test Scenarios**: Complete workflows for end-to-end testing

**Time to Setup**: ~15-30 minutes
**Prerequisites**: Completed credential setup and verification

---

## 📁 Directory Structure

```
sample-data/
├── README.md                 # This file
├── findings/                 # Sample clinical findings
│   ├── ct-chest.txt
│   ├── mri-brain.txt
│   ├── xray-spine.txt
│   └── ultrasound-abdomen.txt
├── templates/                # Sample report templates
│   ├── ct-chest-template.txt
│   ├── mri-brain-template.txt
│   ├── xray-spine-template.txt
│   └── ultrasound-abdomen-template.txt
├── audio/                    # Sample audio dictations
│   ├── sample-dictation-1.mp3
│   ├── sample-dictation-2.mp3
│   └── README-audio.md
├── database/                 # Database seed scripts
│   ├── seed-users.sql
│   ├── seed-templates.sql
│   └── seed-reports.sql
└── test-cases/              # Test scenarios
    ├── espresso-mode-test.json
    ├── slow-brewed-mode-test.json
    └── template-integration-test.json
```

---

## 📝 Sample Findings

### CT Chest Finding

**File**: `findings/ct-chest.txt`

```
There is a 2.5 cm spiculated nodule in the right upper lobe at the level of the 3rd rib.
Multiple small nodules measuring up to 5 mm are scattered throughout both lung fields.
Mediastinal lymph nodes are enlarged, the largest measuring 1.8 cm in the right paratracheal region.
Small right pleural effusion is noted.
No pneumothorax.
Heart size is normal.
```

**Use Case**: Testing report generation with positive findings and template integration

---

### MRI Brain Finding

**File**: `findings/mri-brain.txt`

```
There is a 3 cm enhancing mass in the left frontal lobe with surrounding vasogenic edema.
Midline shift of approximately 5 mm to the right.
Mild compression of the left lateral ventricle.
The posterior fossa structures are unremarkable.
No acute hemorrhage or infarction.
```

**Use Case**: Testing critical findings identification and clinical advice generation

---

### X-Ray Spine Finding

**File**: `findings/xray-spine.txt`

```
There is a compression fracture of the L1 vertebral body with approximately 30% height loss.
Degenerative changes are noted at multiple levels with disc space narrowing at L4-L5 and L5-S1.
Facet joint arthropathy is present at L4-L5.
Alignment is otherwise maintained.
No spondylolisthesis.
```

**Use Case**: Testing template integration with mixed positive and negative findings

---

### Ultrasound Abdomen Finding

**File**: `findings/ultrasound-abdomen.txt`

```
The liver demonstrates multiple hyperechoic lesions consistent with hemangiomas, the largest measuring 3.2 cm in segment 7.
No bile duct dilatation.
Gallbladder contains multiple small stones without evidence of cholecystitis.
Spleen, kidneys, and pancreas are unremarkable.
No free fluid in the abdomen.
```

**Use Case**: Testing multiple organ systems with differential diagnosis generation

---

## 📄 Sample Templates

### CT Chest Template

**File**: `templates/ct-chest-template.txt`

```
CT CHEST WITHOUT IV CONTRAST

TECHNIQUE: Axial CT images of the chest were obtained without intravenous contrast from the lung apices to the upper abdomen.

COMPARISON: None available.

FINDINGS:
The lungs are clear without focal consolidation, mass, or nodule. No pleural effusion or pneumothorax. The mediastinal and hilar contours are normal. No enlarged lymph nodes. The heart size is normal. The visualized portions of the upper abdomen are unremarkable.

IMPRESSION:
No acute cardiopulmonary abnormality.
```

**Modality**: CT
**Body Part**: Chest
**Use Case**: Normal chest CT baseline for integration testing

---

### MRI Brain Template

**File**: `templates/mri-brain-template.txt`

```
MRI BRAIN WITH AND WITHOUT IV CONTRAST

TECHNIQUE: Multiplanar, multisequence MR imaging of the brain was performed with and without intravenous gadolinium contrast.

COMPARISON: None available.

FINDINGS:
The brain parenchyma demonstrates normal signal intensity on all sequences. No focal mass, abnormal enhancement, or restricted diffusion. The ventricles and sulci are normal in size and configuration for age. No midline shift. The posterior fossa structures are unremarkable. The visualized paranasal sinuses and mastoid air cells are well aerated.

IMPRESSION:
No acute intracranial abnormality.
```

**Modality**: MRI
**Body Part**: Brain
**Use Case**: Normal brain MRI for contrast comparison

---

### X-Ray Spine Template

**File**: `templates/xray-spine-template.txt`

```
LUMBAR SPINE X-RAY - AP AND LATERAL

TECHNIQUE: AP and lateral radiographs of the lumbar spine were obtained.

COMPARISON: None available.

FINDINGS:
Alignment is anatomic. No evidence of acute fracture or dislocation. Vertebral body heights are maintained. Intervertebral disc spaces are preserved. No significant degenerative changes. Pedicles and posterior elements are intact. No spondylolisthesis. Visualized soft tissues are unremarkable.

IMPRESSION:
No acute osseous abnormality of the lumbar spine.
```

**Modality**: X-Ray
**Body Part**: Lumbar Spine
**Use Case**: Testing template modification with fracture findings

---

## 🎙️ Sample Audio Files

**Note**: Due to file size limitations, actual audio files are not included in this repository. Please prepare your own sample audio files or use text-to-speech to generate them.

### Creating Sample Audio Files

#### Option 1: Use Text-to-Speech (Recommended for Testing)

```bash
# macOS (using 'say' command)
say -o sample-data/audio/sample-dictation-1.mp3 -v Alex --file-format=mp4f "There is a spiculated nodule in the right upper lobe measuring 2.5 centimeters. Multiple small nodules are present bilaterally. Mediastinal lymphadenopathy is noted. Small right pleural effusion."

# Linux (using 'espeak')
espeak -f findings/ct-chest.txt -w sample-data/audio/sample-dictation-1.wav

# Then convert to MP3
ffmpeg -i sample-data/audio/sample-dictation-1.wav sample-data/audio/sample-dictation-1.mp3
```

#### Option 2: Record Your Own (More Realistic)

1. Open your preferred audio recording software
2. Record yourself reading the sample findings
3. Save as MP3 or WAV format
4. Place in `sample-data/audio/` directory

#### Option 3: Use Online TTS Services

- **Google Cloud TTS**: https://cloud.google.com/text-to-speech
- **Amazon Polly**: https://aws.amazon.com/polly/
- **Microsoft Azure TTS**: https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/

### Audio File Specifications

- **Format**: MP3 or WAV
- **Quality**: 16kHz or higher sample rate
- **Duration**: 10-60 seconds per sample
- **Content**: Clear medical dictation with proper pronunciation
- **Size**: < 10MB per file for testing

### Sample Dictation Scripts

#### Sample 1: CT Chest with Nodule

```
"CT chest without contrast. There is a spiculated nodule in the right upper lobe measuring 2.5 centimeters. Multiple small nodules measuring up to 5 millimeters are scattered throughout both lung fields. Mediastinal lymph nodes are enlarged comma the largest measuring 1.8 centimeters in the right paratracheal region period. Small right pleural effusion is noted period. No pneumothorax period. Heart size is normal period."
```

**Features to Test**:
- Spoken punctuation ("comma", "period")
- Medical terminology pronunciation
- Numbers and measurements

#### Sample 2: MRI Brain with Mass

```
"MRI brain with and without contrast. There is a 3 centimeter enhancing mass in the left frontal lobe with surrounding vasogenic edema period. Midline shift of approximately 5 millimeters to the right period. Mild compression of the left lateral ventricle period. The posterior fossa structures are unremarkable period. No acute hemorrhage or infarction period."
```

**Features to Test**:
- Complex anatomical terms
- Critical findings recognition
- Spatial relationships

---

## 💾 Database Seed Data

### Users Table Seed

**File**: `database/seed-users.sql`

```sql
-- Sample test users (Note: In production, these will come from Outseta)
-- This is just for local development testing

INSERT INTO public.users (id, email, name, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'test.radiologist@example.com', 'Dr. Test Radiologist', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'demo.user@example.com', 'Dr. Demo User', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

### Templates Table Seed

**File**: `database/seed-templates.sql`

```sql
-- Sample templates for testing

INSERT INTO public.templates (user_id, name, content, description, modality, body_part, tags, is_default, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'CT Chest Standard',
    'CT CHEST WITHOUT IV CONTRAST

TECHNIQUE: Axial CT images of the chest were obtained without intravenous contrast from the lung apices to the upper abdomen.

COMPARISON: None available.

FINDINGS:
The lungs are clear without focal consolidation, mass, or nodule. No pleural effusion or pneumothorax. The mediastinal and hilar contours are normal. No enlarged lymph nodes. The heart size is normal. The visualized portions of the upper abdomen are unremarkable.

IMPRESSION:
No acute cardiopulmonary abnormality.',
    'Standard CT chest template without contrast',
    'CT',
    'Chest',
    ARRAY['chest', 'ct', 'thorax'],
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'MRI Brain Standard',
    'MRI BRAIN WITH AND WITHOUT IV CONTRAST

TECHNIQUE: Multiplanar, multisequence MR imaging of the brain was performed with and without intravenous gadolinium contrast.

COMPARISON: None available.

FINDINGS:
The brain parenchyma demonstrates normal signal intensity on all sequences. No focal mass, abnormal enhancement, or restricted diffusion. The ventricles and sulci are normal in size and configuration for age. No midline shift. The posterior fossa structures are unremarkable. The visualized paranasal sinuses and mastoid air cells are well aerated.

IMPRESSION:
No acute intracranial abnormality.',
    'Standard brain MRI template with contrast',
    'MRI',
    'Brain',
    ARRAY['brain', 'mri', 'neuro'],
    false,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'X-Ray Lumbar Spine',
    'LUMBAR SPINE X-RAY - AP AND LATERAL

TECHNIQUE: AP and lateral radiographs of the lumbar spine were obtained.

COMPARISON: None available.

FINDINGS:
Alignment is anatomic. No evidence of acute fracture or dislocation. Vertebral body heights are maintained. Intervertebral disc spaces are preserved. No significant degenerative changes. Pedicles and posterior elements are intact. No spondylolisthesis. Visualized soft tissues are unremarkable.

IMPRESSION:
No acute osseous abnormality of the lumbar spine.',
    'Standard lumbar spine x-ray template',
    'X-Ray',
    'Lumbar Spine',
    ARRAY['spine', 'xray', 'lumbar'],
    false,
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;
```

### Running the Seed Scripts

```bash
# Method 1: Using Supabase CLI
supabase db reset  # This will reset and seed the database
supabase db push   # Push migrations and seeds

# Method 2: Using psql directly
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f sample-data/database/seed-users.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f sample-data/database/seed-templates.sql

# Method 3: Using Supabase dashboard
# Copy the SQL content and run in SQL Editor at:
# https://app.supabase.com/project/[YOUR-PROJECT]/sql
```

---

## 🧪 Testing Scenarios

### Test Case 1: Espresso Mode (Fast Generation)

**File**: `test-cases/espresso-mode-test.json`

```json
{
  "test_name": "Espresso Mode - CT Chest with Nodule",
  "mode": "espresso",
  "inputs": {
    "scan_type": "CT Chest",
    "clinical_history": "55-year-old male smoker with persistent cough",
    "findings": "There is a 2.5 cm spiculated nodule in the right upper lobe at the level of the 3rd rib. Multiple small nodules measuring up to 5 mm are scattered throughout both lung fields. Mediastinal lymph nodes are enlarged, the largest measuring 1.8 cm in the right paratracheal region. Small right pleural effusion is noted.",
    "comparison": "CT chest from 6 months ago showed no nodules",
    "template_id": "uuid-of-ct-chest-template",
    "include_advice": true,
    "include_questions": true,
    "include_differential": true
  },
  "expected_results": {
    "generation_time": "< 10 seconds",
    "model_used": "gpt-5 or gpt-4o-mini",
    "sections_present": ["technique", "comparison", "findings", "impression", "clinical_advice", "clinician_questions", "differential_diagnosis"],
    "findings_integration": "Should merge template normal findings with user's abnormal findings",
    "no_contradictions": "Should not say 'lungs are clear' when nodules are present"
  },
  "verification_steps": [
    "Check that nodules are mentioned in findings",
    "Verify template normal findings are integrated (heart size, no pneumothorax)",
    "Ensure no contradictory statements",
    "Confirm clinical advice includes follow-up recommendations",
    "Verify differential diagnosis includes lung cancer considerations"
  ]
}
```

### Test Case 2: Slow-Brewed Mode (Detailed Generation)

**File**: `test-cases/slow-brewed-mode-test.json`

```json
{
  "test_name": "Slow-Brewed Mode - MRI Brain with Mass",
  "mode": "slow_brewed",
  "inputs": {
    "scan_type": "MRI Brain",
    "clinical_history": "42-year-old female with new onset seizures and headaches",
    "findings": "There is a 3 cm enhancing mass in the left frontal lobe with surrounding vasogenic edema. Midline shift of approximately 5 mm to the right. Mild compression of the left lateral ventricle.",
    "comparison": "None",
    "template_id": "uuid-of-mri-brain-template",
    "include_advice": true,
    "include_questions": true,
    "include_differential": true
  },
  "expected_results": {
    "generation_time": "< 30 seconds",
    "model_used": "o3 or gpt-4o",
    "sections_present": ["technique", "comparison", "findings", "impression", "clinical_advice", "clinician_questions", "differential_diagnosis"],
    "detail_level": "Comprehensive with detailed reasoning",
    "critical_findings": "Should flag mass effect and midline shift as critical",
    "differential_count": "5 diagnoses with detailed reasoning"
  },
  "verification_steps": [
    "Check for comprehensive anatomical descriptions",
    "Verify critical findings are prominently mentioned",
    "Ensure detailed differential diagnosis (5 options)",
    "Confirm clinical advice includes urgent recommendations",
    "Verify questions address neurosurgery consultation"
  ]
}
```

### Test Case 3: Template Integration with Mixed Findings

**File**: `test-cases/template-integration-test.json`

```json
{
  "test_name": "Template Integration - X-Ray Spine with Fracture",
  "mode": "espresso",
  "inputs": {
    "scan_type": "X-Ray Lumbar Spine",
    "clinical_history": "68-year-old female with back pain after fall",
    "findings": "There is a compression fracture of the L1 vertebral body with approximately 30% height loss. Degenerative changes are noted at multiple levels.",
    "comparison": "None",
    "template_id": "uuid-of-xray-spine-template",
    "include_advice": true,
    "include_questions": false,
    "include_differential": true
  },
  "expected_results": {
    "template_integration": "Should adapt template to mention fracture at L1 while keeping normal findings for other levels",
    "adaptation_example": "Instead of 'No fracture' should say 'Fracture at L1. No fracture at other levels.'",
    "no_contradictions": "Should not say 'vertebral body heights are maintained' when fracture is present",
    "preserved_normals": "Should keep template's normal findings for alignment, other levels, etc."
  },
  "verification_steps": [
    "Confirm L1 fracture is prominently mentioned",
    "Verify template normals are adapted not contradicted",
    "Check that other levels are described as intact",
    "Ensure degenerative changes are integrated smoothly",
    "Confirm no 'Pertinent Negatives' heading appears"
  ]
}
```

---

## 🚀 Usage Instructions

### Step 1: Prepare Sample Data

```bash
# 1. Create sample audio files (see Audio Files section above)
mkdir -p sample-data/audio
# Generate or record your audio files here

# 2. Create sample findings files
mkdir -p sample-data/findings
cat > sample-data/findings/ct-chest.txt << 'EOF'
There is a 2.5 cm spiculated nodule in the right upper lobe at the level of the 3rd rib.
Multiple small nodules measuring up to 5 mm are scattered throughout both lung fields.
Mediastinal lymph nodes are enlarged, the largest measuring 1.8 cm in the right paratracheal region.
Small right pleural effusion is noted.
No pneumothorax.
Heart size is normal.
EOF

# 3. Create sample templates
mkdir -p sample-data/templates
# Copy templates from the sections above into individual files
```

### Step 2: Seed Database

```bash
# Option A: Using Supabase CLI (recommended)
cd sample-data/database
supabase db reset

# Option B: Manual SQL execution
# Open Supabase dashboard SQL editor
# Copy and execute seed-users.sql
# Copy and execute seed-templates.sql
```

### Step 3: Test the Application

```bash
# 1. Start the development server
npm run dev

# 2. Test transcription
curl -X POST http://localhost:3001/api/transcribe \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -F "audio=@sample-data/audio/sample-dictation-1.mp3"

# 3. Test report generation
curl -X POST http://localhost:3001/api/generate \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d @sample-data/test-cases/espresso-mode-test.json

# 4. Test template retrieval
curl http://localhost:3001/api/templates \
  -H "Authorization: Bearer YOUR_TEST_TOKEN"
```

### Step 4: Verify Results

Check that:
- ✅ Audio transcription returns accurate text with spoken punctuation converted
- ✅ Report generation completes without errors
- ✅ Template integration works correctly (no contradictions)
- ✅ All report sections are present
- ✅ Clinical advice and differential diagnoses are generated
- ✅ Response times are within expected ranges

---

## 📊 Expected Test Results

### Espresso Mode
- **Generation Time**: 5-10 seconds
- **Model**: GPT-5 (fallback to GPT-4o-mini)
- **Temperature**: 0.3
- **Max Tokens**: 4000
- **Quality**: Good, concise reports

### Slow-Brewed Mode
- **Generation Time**: 15-30 seconds
- **Model**: O3 (fallback to GPT-4o)
- **Temperature**: 0.1
- **Max Tokens**: 8000
- **Quality**: Excellent, comprehensive reports with detailed reasoning

### Template Integration
- **Behavior**: Merges user findings with template normals
- **Adaptation**: Modifies template statements to avoid contradictions
- **Style**: Single flowing narrative without subsections
- **Forbidden**: No "Pertinent Negatives" sections

---

## 🐛 Troubleshooting

### Issue: Audio transcription fails

**Solutions**:
- Check audio file format (MP3 or WAV)
- Verify file size < 100MB
- Ensure Whisper API key is valid
- Check audio quality (minimum 16kHz)

### Issue: Report generation returns errors

**Solutions**:
- Verify OpenAI API key has GPT-5/O3 access
- Check that all required fields are provided
- Ensure template ID exists in database
- Review API logs for specific error messages

### Issue: Template integration produces contradictions

**Solutions**:
- Check that `cleanConflictingNormals()` function is working
- Verify template content follows standard format
- Review prompt engineering in `report_prompt.txt`
- Test with simpler findings first

### Issue: Slow response times

**Solutions**:
- Switch to espresso mode for testing
- Check network latency to OpenAI API
- Verify model fallback is working
- Monitor API rate limits

---

## 📚 Additional Resources

- **Main Setup Guide**: `../SETUP_CREDENTIALS_GUIDE.md`
- **Credentials Template**: `../credentials.env.template`
- **Verification Script**: `../scripts/verify-setup.sh`
- **Source Code**: `../RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/`

---

## ✅ Quick Verification Checklist

- [ ] Sample findings files created
- [ ] Sample templates files created
- [ ] Audio files prepared (real or TTS)
- [ ] Database seeded with test data
- [ ] Test user credentials configured
- [ ] Transcription endpoint tested
- [ ] Report generation endpoint tested (espresso mode)
- [ ] Report generation endpoint tested (slow-brewed mode)
- [ ] Template integration verified (no contradictions)
- [ ] All sections present in generated reports
- [ ] Clinical advice and differential diagnoses generated
- [ ] Search functionality tested (optional)
- [ ] Response times within acceptable ranges

---

## 🎉 Success Criteria

Your setup is complete and working when:

1. ✅ Audio files transcribe correctly with spoken punctuation converted
2. ✅ Reports generate in both espresso and slow-brewed modes
3. ✅ Templates integrate without contradictions
4. ✅ All required report sections are present
5. ✅ Critical findings are properly identified
6. ✅ Differential diagnoses are comprehensive and relevant
7. ✅ Clinical advice is appropriate and actionable
8. ✅ Response times meet expectations (< 10s espresso, < 30s slow-brewed)

---

**Need Help?**

If you encounter issues not covered in this guide:
1. Check the main `SETUP_CREDENTIALS_GUIDE.md` troubleshooting section
2. Run the verification script: `./scripts/verify-setup.sh`
3. Review application logs for specific error messages
4. Consult the source code documentation

---

*Last Updated: 2025*
*Version: 1.0*

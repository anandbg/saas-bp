-- ==============================================================================
-- SAMPLE REPORTS SEED DATA
-- ==============================================================================
-- Sample generated reports for testing and demonstration
-- ==============================================================================

-- Sample Report 1: CT Chest with Nodule
INSERT INTO public.reports (
  id,
  user_id,
  scan_type,
  clinical_history,
  findings,
  comparison,
  template_id,
  mode,
  technique,
  report_findings,
  impression,
  clinical_advice,
  clinician_questions,
  differential_diagnosis,
  generation_time_ms,
  model_used,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'CT Chest',
  '55-year-old male smoker with persistent cough for 3 months',
  'There is a 2.5 cm spiculated nodule in the right upper lobe at the level of the 3rd rib. Multiple small nodules measuring up to 5 mm are scattered throughout both lung fields. Mediastinal lymph nodes are enlarged, the largest measuring 1.8 cm in the right paratracheal region. Small right pleural effusion is noted.',
  'CT chest from 6 months ago showed no nodules',
  id,
  'espresso',
  'Axial CT images of the chest were obtained without intravenous contrast from the lung apices to the upper abdomen.',
  'There is a 2.5 cm spiculated nodule in the right upper lobe at the level of the 3rd rib, which is new compared to the prior study. Multiple small nodules measuring up to 5 mm are scattered throughout both lung fields. Mediastinal lymph nodes are enlarged, the largest measuring 1.8 cm in the right paratracheal region. Small right pleural effusion is noted. No pneumothorax. The heart size is normal. The visualized portions of the upper abdomen are unremarkable.',
  '1. Suspicious 2.5 cm spiculated nodule in the right upper lobe, concerning for primary lung malignancy.
2. Multiple bilateral small pulmonary nodules.
3. Mediastinal lymphadenopathy.
4. Small right pleural effusion.',
  'Recommend:
1. PET-CT for staging evaluation
2. Pulmonology consultation for possible biopsy
3. Comparison with any available prior chest imaging
4. Clinical correlation with tumor markers if available',
  ARRAY[
    'What is the recommended next step for tissue diagnosis?',
    'Should we perform a PET-CT before or after biopsy?',
    'Are the bilateral small nodules likely metastatic or separate primaries?',
    'What is the significance of the mediastinal lymphadenopathy?',
    'Should we consider bronchoscopy or CT-guided biopsy?'
  ],
  jsonb_build_array(
    jsonb_build_object('diagnosis', 'Primary lung adenocarcinoma', 'reasoning', 'Spiculated nodule in a smoker with lymphadenopathy is highly suspicious for malignancy'),
    jsonb_build_object('diagnosis', 'Lung metastases from occult primary', 'reasoning', 'Multiple bilateral nodules could represent metastatic disease'),
    jsonb_build_object('diagnosis', 'Infectious granulomatous disease', 'reasoning', 'Less likely given spiculated morphology but cannot be excluded')
  ),
  8500,
  'gpt-5',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days'
FROM public.templates
WHERE name = 'CT Chest Standard'
  AND user_id = '00000000-0000-0000-0000-000000000001'
LIMIT 1;

-- Sample Report 2: MRI Brain Normal
INSERT INTO public.reports (
  id,
  user_id,
  scan_type,
  clinical_history,
  findings,
  comparison,
  template_id,
  mode,
  technique,
  report_findings,
  impression,
  clinical_advice,
  clinician_questions,
  differential_diagnosis,
  generation_time_ms,
  model_used,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'MRI Brain',
  '35-year-old female with headaches',
  'No significant abnormality detected.',
  NULL,
  id,
  'slow_brewed',
  'Multiplanar, multisequence MR imaging of the brain was performed with and without intravenous gadolinium contrast.',
  'The brain parenchyma demonstrates normal signal intensity on all sequences. No focal mass, abnormal enhancement, or restricted diffusion. The ventricles and sulci are normal in size and configuration for age. No midline shift. The posterior fossa structures are unremarkable. The visualized paranasal sinuses and mastoid air cells are well aerated.',
  'No acute intracranial abnormality.',
  'Clinical correlation recommended. If headaches persist, consider neurology consultation for evaluation of primary headache disorder.',
  ARRAY[
    'Could these headaches be tension-type or migraine?',
    'Should we consider lumbar puncture if symptoms persist?',
    'Are there any vascular variants that could contribute to symptoms?',
    'Would MR angiography be helpful?',
    'What is the role of outpatient neurology follow-up?'
  ],
  jsonb_build_array(
    jsonb_build_object('diagnosis', 'Primary headache disorder (tension-type or migraine)', 'reasoning', 'Normal imaging suggests non-structural etiology'),
    jsonb_build_object('diagnosis', 'Idiopathic intracranial hypertension', 'reasoning', 'Would require lumbar puncture for diagnosis'),
    jsonb_build_object('diagnosis', 'Cervicogenic headache', 'reasoning', 'Could consider cervical spine imaging if clinically suspected')
  ),
  25000,
  'o3',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM public.templates
WHERE name = 'MRI Brain Standard'
  AND user_id = '00000000-0000-0000-0000-000000000001'
LIMIT 1;

-- Sample Report 3: X-Ray Spine with Fracture
INSERT INTO public.reports (
  id,
  user_id,
  scan_type,
  clinical_history,
  findings,
  comparison,
  template_id,
  mode,
  technique,
  report_findings,
  impression,
  clinical_advice,
  clinician_questions,
  differential_diagnosis,
  generation_time_ms,
  model_used,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'X-Ray Lumbar Spine',
  '68-year-old female with back pain after fall',
  'There is a compression fracture of the L1 vertebral body with approximately 30% height loss. Degenerative changes are noted at multiple levels.',
  NULL,
  id,
  'espresso',
  'AP and lateral radiographs of the lumbar spine were obtained.',
  'There is a compression fracture of the L1 vertebral body with approximately 30% height loss. Degenerative changes are noted at multiple levels with disc space narrowing at L4-L5 and L5-S1. Facet joint arthropathy is present at L4-L5. Alignment is otherwise anatomic. No evidence of acute fracture or dislocation at other levels. Vertebral body heights are maintained at other levels. Pedicles and posterior elements are intact. No spondylolisthesis. Visualized soft tissues are unremarkable.',
  '1. Acute compression fracture of L1 vertebral body with 30% height loss.
2. Multilevel degenerative changes of the lumbar spine.',
  'Recommend:
1. MRI lumbar spine to assess for acute marrow edema and ligamentous injury
2. Evaluate for osteoporosis with DEXA scan
3. Consider vertebroplasty or kyphoplasty if pain persists
4. Pain management consultation
5. Fall risk assessment',
  ARRAY[
    'Is MRI needed to assess for acute versus chronic fracture?',
    'Should we evaluate for underlying osteoporosis?',
    'What are the indications for vertebroplasty?',
    'Should we image the thoracic spine as well?',
    'What weight-bearing restrictions should be advised?'
  ],
  jsonb_build_array(
    jsonb_build_object('diagnosis', 'Acute osteoporotic compression fracture', 'reasoning', 'Common in elderly females, especially post-traumatic'),
    jsonb_build_object('diagnosis', 'Pathologic fracture from metastasis or myeloma', 'reasoning', 'Would require MRI and lab work to exclude'),
    jsonb_build_object('diagnosis', 'Insufficiency fracture', 'reasoning', 'Related to osteoporosis without significant trauma')
  ),
  7200,
  'gpt-5',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
FROM public.templates
WHERE name = 'X-Ray Lumbar Spine'
  AND user_id = '00000000-0000-0000-0000-000000000001'
LIMIT 1;

-- Verify insertion
SELECT
  id,
  user_id,
  scan_type,
  mode,
  model_used,
  generation_time_ms,
  created_at
FROM public.reports
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC;

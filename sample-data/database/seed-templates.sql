-- ==============================================================================
-- SAMPLE TEMPLATES SEED DATA
-- ==============================================================================
-- Pre-built report templates for common radiology scans
-- ==============================================================================

-- CT Chest Template
INSERT INTO public.templates (
  user_id,
  name,
  content,
  description,
  modality,
  body_part,
  tags,
  is_default,
  created_at,
  updated_at
)
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
    ARRAY['chest', 'ct', 'thorax', 'lung'],
    true,
    NOW(),
    NOW()
  ),

  -- MRI Brain Template
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
    ARRAY['brain', 'mri', 'neuro', 'head'],
    false,
    NOW(),
    NOW()
  ),

  -- X-Ray Lumbar Spine Template
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
    ARRAY['spine', 'xray', 'lumbar', 'back'],
    false,
    NOW(),
    NOW()
  ),

  -- Ultrasound Abdomen Template
  (
    '00000000-0000-0000-0000-000000000001',
    'Ultrasound Abdomen Complete',
    'ULTRASOUND ABDOMEN COMPLETE

TECHNIQUE: Real-time ultrasound examination of the abdomen was performed.

COMPARISON: None available.

FINDINGS:
The liver is normal in size and echotexture. No focal hepatic lesion. The intrahepatic bile ducts are not dilated. The common bile duct measures normal in caliber. The gallbladder is normal without stones or wall thickening. The pancreas is visualized and appears unremarkable. The spleen is normal in size. Both kidneys are normal in size and echotexture without hydronephrosis or stones. No free fluid in the abdomen.

IMPRESSION:
Normal abdominal ultrasound examination.',
    'Complete abdominal ultrasound template',
    'Ultrasound',
    'Abdomen',
    ARRAY['abdomen', 'ultrasound', 'liver', 'kidney'],
    false,
    NOW(),
    NOW()
  ),

  -- Chest X-Ray Template
  (
    '00000000-0000-0000-0000-000000000001',
    'Chest X-Ray PA and Lateral',
    'CHEST X-RAY - PA AND LATERAL

TECHNIQUE: PA and lateral chest radiographs were obtained.

COMPARISON: None available.

FINDINGS:
The lungs are clear without focal consolidation. No pleural effusion or pneumothorax. The cardiac silhouette is normal in size. The mediastinal contours are unremarkable. No acute osseous abnormality. Visualized soft tissues are unremarkable.

IMPRESSION:
No acute cardiopulmonary process.',
    'Standard chest x-ray template',
    'X-Ray',
    'Chest',
    ARRAY['chest', 'xray', 'cxr', 'thorax'],
    false,
    NOW(),
    NOW()
  ),

  -- CT Head Template
  (
    '00000000-0000-0000-0000-000000000001',
    'CT Head Without Contrast',
    'CT HEAD WITHOUT IV CONTRAST

TECHNIQUE: Axial CT images of the head were obtained without intravenous contrast.

COMPARISON: None available.

FINDINGS:
No acute intracranial hemorrhage, mass effect, or midline shift. The ventricles and sulci are normal in size for age. The gray-white matter differentiation is preserved. No acute territorial infarction. The visualized osseous structures are intact. The visualized paranasal sinuses and mastoid air cells are clear.

IMPRESSION:
No acute intracranial abnormality.',
    'Standard non-contrast head CT template',
    'CT',
    'Head',
    ARRAY['head', 'ct', 'brain', 'neuro'],
    false,
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Create templates for second test user
INSERT INTO public.templates (
  user_id,
  name,
  content,
  description,
  modality,
  body_part,
  tags,
  is_default,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000002',
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
  )
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT
  id,
  user_id,
  name,
  modality,
  body_part,
  is_default,
  created_at
FROM public.templates
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
ORDER BY user_id, created_at;

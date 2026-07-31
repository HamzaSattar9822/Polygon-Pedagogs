function toggleMenu() {
  document.getElementById('navWrap').classList.toggle('mobile-open');
}

function toggleGuide(show) {
  const guide = document.getElementById('floatingGuide');
  const closed = document.getElementById('guideClosed');
  if (guide) guide.style.display = show ? 'block' : 'none';
  if (closed) closed.style.display = show ? 'none' : 'block';
}

const API = {
  referral: '/api/forms/referral',
  parent: '/api/forms/parent-enquiry',
  tutor: '/api/forms/tutor-application',
  contact: '/api/forms/contact',
};

const templates = {
  referral: {
    title: 'Make a Referral',
    intro: 'Professional referral form for schools, councils, SEND teams, alternative provision teams and education professionals.',
    html: `
      <div class="urgent-note"><strong>Safeguarding note:</strong> This form is not for emergencies. If a child is in immediate danger, call 999. For urgent safeguarding concerns, contact the Designated Safeguarding Lead using the safeguarding contact details.</div>
      <div class="form-note">This form should collect enough information to review suitability, plan provision and arrange a safe first step. Sensitive information should only be shared where necessary and through a secure system.</div>
      <form data-form="referral" enctype="multipart/form-data">
        <div class="form-grid">
          <div class="section-title-small">1. Referrer details</div>
          <div class="field"><label>Referrer full name *</label><input name="referrer_name" required placeholder="Full name"></div>
          <div class="field"><label>Job title / role *</label><input name="job_title" required placeholder="SENCO, AP Lead, Social Worker..."></div>
          <div class="field"><label>Organisation *</label><input name="organisation" required placeholder="School / Council / Virtual School / Team"></div>
          <div class="field"><label>Work email *</label><input name="work_email" required type="email" placeholder="name@organisation.org.uk"></div>
          <div class="field"><label>Phone number *</label><input name="phone" required placeholder="Contact number"></div>
          <div class="field"><label>Referral source *</label><select name="referral_source" required><option value="">Select one</option><option>School</option><option>Local authority</option><option>SEND team</option><option>Alternative provision team</option><option>Virtual school</option><option>Charity / funding organisation</option><option>Parent / carer</option><option>Other professional</option></select></div>

          <div class="section-title-small">2. Learner information</div>
          <div class="field"><label>Learner initials or reference ID *</label><input name="learner_ref" required placeholder="Use initials or secure reference ID"></div>
          <div class="field"><label>Year group / age *</label><input name="year_group" required placeholder="e.g. Year 8 / age 13"></div>
          <div class="field"><label>Current education status *</label><select name="education_status" required><option value="">Select one</option><option>In school but needs additional support</option><option>Not currently attending school</option><option>Awaiting placement</option><option>Excluded or at risk of exclusion</option><option>Home educated</option><option>Medical needs / unable to attend</option><option>Other</option></select></div>
          <div class="field"><label>Preferred delivery method</label><select name="delivery_method"><option>Online</option><option>In-person</option><option>Hybrid</option><option>Not sure yet</option></select></div>

          <div class="section-title-small">3. Support required</div>
          <div class="checkbox-grid">
            <label class="checkbox-line"><input type="checkbox" name="support_types" value="SEND tuition"> SEND tuition</label>
            <label class="checkbox-line"><input type="checkbox" name="support_types" value="Alternative provision"> Alternative provision</label>
            <label class="checkbox-line"><input type="checkbox" name="support_types" value="One-to-one tuition"> One-to-one tuition</label>
            <label class="checkbox-line"><input type="checkbox" name="support_types" value="Small-group tuition"> Small-group tuition</label>
            <label class="checkbox-line"><input type="checkbox" name="support_types" value="Online tuition"> Online tuition</label>
            <label class="checkbox-line"><input type="checkbox" name="support_types" value="In-person tuition"> In-person tuition</label>
          </div>
          <div class="checkbox-grid">
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="English"> English</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Maths"> Maths</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Science"> Science</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="GCSE support"> GCSE support</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Functional Skills"> Functional Skills</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Other subject"> Other subject</label>
          </div>
          <div class="field"><label>Requested hours per week</label><input name="hours_per_week" placeholder="e.g. 5 hours per week"></div>
          <div class="field"><label>Preferred start date</label><input name="preferred_start" type="date"></div>

          <div class="section-title-small">4. SEND, needs and suitability information</div>
          <div class="field"><label>EHCP status</label><select name="ehcp_status"><option>Unknown / not applicable</option><option>EHCP in place</option><option>EHCP in progress</option><option>No EHCP</option></select></div>
          <div class="field"><label>Main area of need</label><select name="main_need"><option>Not sure / to be discussed</option><option>ADHD</option><option>ASD / Autism</option><option>Sensory Processing Difficulties / SPD</option><option>SEMH</option><option>Speech, language and communication needs</option><option>Dyslexia / literacy difficulty</option><option>Severe or complex needs</option><option>Medical needs</option><option>Other</option></select></div>
          <div class="field full"><label>Brief learner profile</label><textarea name="learner_profile" placeholder="Please summarise strengths, barriers to learning, SEND needs, communication needs, sensory needs, triggers, routines or adjustments that may help."></textarea></div>

          <div class="section-title-small">5. Safeguarding, risk and attendance</div>
          <div class="field"><label>Are there known safeguarding or welfare concerns?</label><select name="safeguarding_concerns"><option>No / not known</option><option>Yes - details to be shared securely</option><option>Unsure</option></select></div>
          <div class="field"><label>Risk assessment available?</label><select name="risk_assessment"><option>No / not yet</option><option>Yes - can upload</option><option>Required before starting</option><option>Not applicable</option></select></div>
          <div class="field full"><label>Key risk or attendance information</label><textarea name="risk_info" placeholder="Please include relevant attendance barriers, behaviour considerations, medical considerations, lone-working considerations or known risks. Do not include unnecessary sensitive details."></textarea></div>

          <div class="section-title-small">6. Documents and consent</div>
          <div class="field full"><label>Secure document upload</label><input type="file" name="documents" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"></div>
          <div class="form-note field full">Suggested documents: EHCP, IEP, pupil passport, risk assessment, attendance record, school report, medical education plan or relevant professional summary. Upload only what is necessary.</div>
        </div>
        <label class="privacy-check"><input type="checkbox" name="privacy_confirmed" value="true" required> <span>I confirm that I have authority to share this information for the purpose of reviewing and arranging educational provision, and I understand that Polygon Pedagogs will process the information in line with its <a href="privacy.html" target="_blank" rel="noopener">Privacy Notice</a>.</span></label>
        <div class="form-status" hidden></div>
        <div class="submit-row">
          <button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" type="submit">Submit Referral</button>
        </div>
      </form>`
  },
  parent: {
    title: 'Parent / Carer Enquiry',
    intro: 'A family-friendly enquiry form for parents and carers. It asks for enough information to guide the right service without collecting unnecessary sensitive details at first contact.',
    html: `
      <form data-form="parent">
        <div class="form-note"><strong>Parent/carer enquiry:</strong> Please share a brief overview only at this stage. If there is an urgent safeguarding concern or a child is in immediate danger, call 999.</div>

        <div class="form-grid">
          <div class="section-title-small">1. Parent / carer details</div>
          <div class="field"><label>Your full name *</label><input name="full_name" required placeholder="Full name"></div>
          <div class="field"><label>Email address *</label><input name="email" required type="email" placeholder="your@email.com"></div>
          <div class="field"><label>Phone number *</label><input name="phone" required placeholder="Contact number"></div>
          <div class="field"><label>Preferred contact method</label><select name="preferred_contact"><option>Email</option><option>Phone call</option><option>Text message</option><option>No preference</option></select></div>
          <div class="field"><label>Your relationship to the learner</label><select name="relationship"><option>Parent</option><option>Carer</option><option>Guardian</option><option>Foster carer</option><option>Other</option></select></div>
          <div class="field"><label>Area / postcode first part</label><input name="area_postcode" placeholder="e.g. SE6, E17, CR0"></div>

          <div class="section-title-small">2. Learner information</div>
          <div class="field"><label>Child's first name or initials</label><input name="child_name" placeholder="First name or initials only"></div>
          <div class="field"><label>Year group / age *</label><input name="year_group" required placeholder="e.g. Year 7 / age 11"></div>
          <div class="field"><label>Current education situation</label><select name="education_situation"><option>Attending mainstream school</option><option>Part-time timetable</option><option>Out of school</option><option>Awaiting school placement</option><option>Home educated</option><option>Excluded / recently excluded</option><option>Medical needs affecting attendance</option><option>Anxiety affecting attendance</option><option>Not sure / prefer to discuss</option></select></div>
          <div class="field"><label>Current school involved?</label><select name="school_involved"><option>Yes</option><option>No</option><option>Not currently</option><option>Prefer to discuss</option></select></div>

          <div class="section-title-small">3. Service you are interested in</div>
          <div class="field full checkbox-grid">
            <label class="checkbox-line"><input type="checkbox" name="services" value="SEND tuition"> SEND tuition</label>
            <label class="checkbox-line"><input type="checkbox" name="services" value="Alternative provision / out-of-school support"> Alternative provision / out-of-school support</label>
            <label class="checkbox-line"><input type="checkbox" name="services" value="One-to-one tuition"> One-to-one tuition</label>
            <label class="checkbox-line"><input type="checkbox" name="services" value="Online tuition"> Online tuition</label>
            <label class="checkbox-line"><input type="checkbox" name="services" value="In-person tuition"> In-person tuition</label>
            <label class="checkbox-line"><input type="checkbox" name="services" value="Home education support"> Home education support</label>
            <label class="checkbox-line"><input type="checkbox" name="services" value="GCSE preparation"> GCSE preparation</label>
            <label class="checkbox-line"><input type="checkbox" name="services" value="Not sure yet"> Not sure yet</label>
          </div>

          <div class="section-title-small">4. Subject support required</div>
          <div class="field full checkbox-grid">
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="English"> English</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Maths"> Maths</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Science"> Science</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Functional Skills"> Functional Skills</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Homework / study support"> Homework / study support</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Other subject"> Other subject</label>
          </div>

          <div class="section-title-small">5. SEND, learning needs and adjustments</div>
          <div class="field"><label>Does your child have an EHCP?</label><select name="ehcp"><option>Prefer not to say at this stage</option><option>Yes</option><option>No</option><option>In progress</option><option>Not sure</option></select></div>
          <div class="field"><label>Type of support needed</label><select name="support_type"><option>Not sure / to be discussed</option><option>Academic catch-up</option><option>Confidence building</option><option>Routine and engagement</option><option>SEND-informed teaching</option><option>Exam preparation</option><option>Alternative provision support</option><option>Home education support</option></select></div>
          <div class="field full checkbox-grid">
            <label class="checkbox-line"><input type="checkbox" name="send_needs" value="ADHD"> ADHD</label>
            <label class="checkbox-line"><input type="checkbox" name="send_needs" value="ASD / Autism"> ASD / Autism</label>
            <label class="checkbox-line"><input type="checkbox" name="send_needs" value="Sensory Processing Difficulties / SPD"> Sensory Processing Difficulties / SPD</label>
            <label class="checkbox-line"><input type="checkbox" name="send_needs" value="SEMH / anxiety-related needs"> SEMH / anxiety-related needs</label>
            <label class="checkbox-line"><input type="checkbox" name="send_needs" value="Dyslexia or literacy difficulty"> Dyslexia or literacy difficulty</label>
            <label class="checkbox-line"><input type="checkbox" name="send_needs" value="Speech, language or communication needs"> Speech, language or communication needs</label>
            <label class="checkbox-line"><input type="checkbox" name="send_needs" value="Medical needs"> Medical needs</label>
            <label class="checkbox-line"><input type="checkbox" name="send_needs" value="Severe or complex needs"> Severe or complex needs</label>
            <label class="checkbox-line"><input type="checkbox" name="send_needs" value="No diagnosed SEND"> No diagnosed SEND</label>
            <label class="checkbox-line"><input type="checkbox" name="send_needs" value="Prefer to discuss"> Prefer to discuss</label>
          </div>
          <div class="field full"><label>Brief overview of support needed</label><textarea name="overview" placeholder="Briefly tell us what support you are looking for, what your child finds difficult, and what usually helps them learn. Please avoid sharing unnecessary sensitive details at this stage."></textarea></div>

          <div class="section-title-small">6. Tuition preferences</div>
          <div class="field"><label>Preferred delivery method</label><select name="delivery_method"><option>Online</option><option>In-person</option><option>Hybrid</option><option>Not sure yet</option></select></div>
          <div class="field"><label>Preferred session frequency</label><select name="session_frequency"><option>Not sure yet</option><option>1 session per week</option><option>2 sessions per week</option><option>3+ sessions per week</option><option>Short-term intensive support</option></select></div>
          <div class="field"><label>Preferred days/times</label><input name="preferred_times" placeholder="e.g. weekdays after 4pm, mornings, weekends"></div>
          <div class="field"><label>When would you like support to start?</label><select name="start_preference"><option>As soon as possible</option><option>Within 2 weeks</option><option>Within 1 month</option><option>Not sure yet</option></select></div>

          <div class="section-title-small">7. Final message</div>
          <div class="field full"><label>Anything else you would like us to know?</label><textarea name="extra_message" placeholder="You can add any key information that will help us understand your enquiry. If sensitive documents are needed, we will request them securely later."></textarea></div>
        </div>

        <div class="form-note">For privacy and safeguarding, the parent enquiry form should not ask for full medical records, full address, detailed safeguarding history or document uploads at first contact. These can be requested later through a secure process if needed.</div>
        <label class="privacy-check"><input type="checkbox" name="privacy_confirmed" value="true" required> <span>I confirm that I am the parent/carer or have responsibility to make this enquiry, and I understand that Polygon Pedagogs will use this information to respond to my enquiry in line with its <a href="privacy.html" target="_blank" rel="noopener">Privacy Notice</a>.</span></label>
        <div class="form-status" hidden></div>
        <div class="submit-row">
          <button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" type="submit">Submit Parent Enquiry</button>
        </div>
      </form>`
  },
  tutor: {
    title: 'Tutor Application',
    intro: 'Detailed tutor recruitment form for Polygon Pedagogs. This supports safer recruitment by collecting role suitability, experience, SEND knowledge, availability, references and declarations.',
    html: `
      <form data-form="tutor" enctype="multipart/form-data">
        <div class="urgent-note"><strong>Safer recruitment note:</strong> Submission of this form does not confirm appointment. Any tutor role with Polygon Pedagogs is subject to suitability review, interview, identity checks, right-to-work checks, references, qualification checks, appropriate DBS checks, safeguarding onboarding and agreement to our policies.</div>
        <div class="form-note">Please provide accurate information. Sensitive documents should only be uploaded where requested and relevant.</div>

        <div class="form-grid">
          <div class="section-title-small">1. Personal details</div>
          <div class="field"><label>Full legal name *</label><input name="legal_name" required placeholder="As shown on official ID"></div>
          <div class="field"><label>Preferred name</label><input name="preferred_name" placeholder="If different"></div>
          <div class="field"><label>Email address *</label><input name="email" required type="email" placeholder="your@email.com"></div>
          <div class="field"><label>Phone number *</label><input name="phone" required placeholder="Contact number"></div>
          <div class="field full"><label>Full home address *</label><textarea name="address" required placeholder="House/flat number, street, town/city, county if applicable"></textarea></div>
          <div class="field"><label>Postcode *</label><input name="postcode" required placeholder="e.g. SE6 3EF"></div>
          <div class="field"><label>Current town / area *</label><input name="town" required placeholder="e.g. Lewisham, Croydon, Birmingham"></div>

          <div class="section-title-small">2. Role and delivery preferences</div>
          <div class="field"><label>Preferred role type *</label><select name="role_type" required><option value="">Select one</option><option>Online tutor</option><option>In-person tutor</option><option>Hybrid tutor</option><option>Alternative provision tutor</option><option>SEND specialist tutor</option><option>Flexible / open to different roles</option></select></div>
          <div class="field"><label>Preferred learner age range *</label><select name="age_range" required><option value="">Select one</option><option>Primary / KS1</option><option>Primary / KS2</option><option>Secondary / KS3</option><option>GCSE / KS4</option><option>Post-16 / Functional Skills</option><option>Multiple age ranges</option></select></div>
          <div class="field full checkbox-grid">
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="English"> English</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Maths"> Maths</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Science"> Science</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Functional Skills English"> Functional Skills English</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Functional Skills Maths"> Functional Skills Maths</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="GCSE preparation"> GCSE preparation</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Primary curriculum"> Primary curriculum</label>
            <label class="checkbox-line"><input type="checkbox" name="subjects" value="Other subject"> Other subject</label>
          </div>
          <div class="field"><label>Other subjects or specialisms</label><input name="other_subjects" placeholder="e.g. Biology, Chemistry, Physics, SEN literacy, EAL"></div>
          <div class="field"><label>Preferred maximum travel distance</label><input name="travel_distance" placeholder="e.g. 30 minutes / 5 miles / online only"></div>

          <div class="section-title-small">3. Qualifications and professional background</div>
          <div class="field"><label>Highest qualification *</label><select name="highest_qualification" required><option value="">Select one</option><option>GCSE / Level 2</option><option>A Level / Level 3</option><option>Undergraduate degree</option><option>Postgraduate degree</option><option>Teaching qualification</option><option>Other professional qualification</option></select></div>
          <div class="field"><label>Relevant degree / subject</label><input name="degree_subject" placeholder="e.g. BSc Mathematics, MSc Data Science, BA English"></div>
          <div class="field"><label>Teaching qualification status</label><select name="teaching_qualification"><option>QTS</option><option>PGCE</option><option>QTLS</option><option>Currently training</option><option>No formal teaching qualification</option><option>Other</option></select></div>
          <div class="field"><label>Years of teaching/tutoring experience *</label><select name="experience_years" required><option value="">Select one</option><option>Less than 1 year</option><option>1-2 years</option><option>3-5 years</option><option>5+ years</option><option>10+ years</option></select></div>
          <div class="field full"><label>Education and tutoring experience summary *</label><textarea name="experience_summary" required placeholder="Summarise your teaching, tutoring, school, SEND, alternative provision or mentoring experience. Include subjects, age groups, settings and outcomes where relevant."></textarea></div>

          <div class="section-title-small">4. SEND and alternative provision experience</div>
          <div class="field"><label>Do you have SEND experience? *</label><select name="send_experience" required><option value="">Select one</option><option>Yes - extensive experience</option><option>Yes - some experience</option><option>Limited experience but willing to train</option><option>No SEND experience</option></select></div>
          <div class="field"><label>Do you have alternative provision / out-of-school experience?</label><select name="ap_experience"><option>Yes - extensive experience</option><option>Yes - some experience</option><option>Limited experience</option><option>No</option></select></div>
          <div class="field full checkbox-grid">
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="ADHD"> ADHD</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="ASD / Autism"> ASD / Autism</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="Sensory Processing Difficulties / SPD"> Sensory Processing Difficulties / SPD</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="SEMH / anxiety-related needs"> SEMH / anxiety-related needs</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="Dyslexia / literacy difficulties"> Dyslexia / literacy difficulties</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="Speech, language and communication needs"> Speech, language and communication needs</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="Medical needs"> Medical needs</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="Severe or complex needs"> Severe or complex needs</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="Excluded pupils"> Excluded pupils</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="Learners awaiting placement"> Learners awaiting placement</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="Emotionally based school avoidance"> Emotionally based school avoidance</label>
            <label class="checkbox-line"><input type="checkbox" name="send_areas" value="Looked-after children / virtual school referrals"> Looked-after children / virtual school referrals</label>
          </div>
          <div class="field full"><label>Describe your SEND/AP approach</label><textarea name="send_approach" placeholder="How do you adapt sessions for learners with SEND, anxiety, low confidence, sensory needs, communication needs or disrupted education?"></textarea></div>

          <div class="section-title-small">5. Safeguarding and safer recruitment information</div>
          <div class="field"><label>Enhanced DBS status *</label><select name="dbs_status" required><option value="">Select one</option><option>I have an Enhanced DBS for child workforce</option><option>I have a DBS but not sure of level</option><option>I am subscribed to the DBS Update Service</option><option>I do not currently have a DBS</option><option>Prefer to discuss</option></select></div>
          <div class="field"><label>DBS Update Service subscription</label><select name="dbs_update"><option>No / not applicable</option><option>Yes</option><option>No</option><option>Not sure</option></select></div>
          <div class="field"><label>Most recent safeguarding training</label><select name="safeguarding_training"><option>Within the last 12 months</option><option>Within the last 2 years</option><option>More than 2 years ago</option><option>No recent safeguarding training</option><option>Not sure</option></select></div>
          <div class="field"><label>Have you read KCSIE or worked under school safeguarding procedures?</label><select name="kcsie"><option>Yes</option><option>No</option><option>Not sure</option><option>Willing to complete required onboarding</option></select></div>
          <div class="field full"><label>Safeguarding experience or training details</label><textarea name="safeguarding_details" placeholder="Mention safeguarding training, school-based safeguarding procedures, DSL reporting experience, Prevent training, online safety training or relevant child protection experience."></textarea></div>

          <div class="section-title-small">6. Right to work and employment suitability</div>
          <div class="field"><label>Do you currently have the right to work in the UK? *</label><select name="right_to_work" required><option value="">Select one</option><option>Yes</option><option>Yes - visa conditions apply</option><option>No</option><option>Not sure</option></select></div>
          <div class="field"><label>If visa conditions apply, please summarise</label><input name="visa_summary" placeholder="e.g. Student visa 20 hours term-time, Graduate visa, Skilled Worker"></div>
          <div class="field"><label>National Insurance number</label><input name="ni_number" placeholder="e.g. QQ 12 34 56 C"></div>
          <div class="field"><label>Are you currently employed in education?</label><select name="currently_employed"><option>Yes - school/college</option><option>Yes - tutoring/education provider</option><option>Yes - other sector</option><option>No</option><option>Prefer to discuss</option></select></div>
          <div class="field"><label>Notice period / earliest start date</label><input name="notice_period" placeholder="e.g. Immediate, 2 weeks, September"></div>
          <div class="field full"><label>Employment history overview</label><textarea name="employment_history" placeholder="Briefly outline recent roles. The full safer recruitment process may require a complete employment history and explanation of gaps."></textarea></div>

          <div class="section-title-small">7. Availability</div>
          <div class="field full checkbox-grid">
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Monday morning"> Monday morning</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Monday afternoon"> Monday afternoon</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Tuesday morning"> Tuesday morning</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Tuesday afternoon"> Tuesday afternoon</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Wednesday morning"> Wednesday morning</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Wednesday afternoon"> Wednesday afternoon</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Thursday morning"> Thursday morning</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Thursday afternoon"> Thursday afternoon</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Friday morning"> Friday morning</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Friday afternoon"> Friday afternoon</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Evenings"> Evenings</label>
            <label class="checkbox-line"><input type="checkbox" name="availability_slots" value="Weekends"> Weekends</label>
          </div>
          <div class="field"><label>Approximate weekly availability</label><select name="weekly_availability"><option>1-3 hours per week</option><option>4-8 hours per week</option><option>9-15 hours per week</option><option>16+ hours per week</option><option>Flexible / varies</option></select></div>
          <div class="field"><label>Preferred working pattern</label><select name="working_pattern"><option>Regular weekly learners</option><option>Short-term intervention blocks</option><option>Daytime AP tuition</option><option>Evening/private tuition</option><option>Flexible</option></select></div>

          <div class="section-title-small">8. References</div>
          <div class="field"><label>Reference 1 name *</label><input name="ref1_name" required placeholder="Preferably recent employer / education reference"></div>
          <div class="field"><label>Reference 1 email *</label><input name="ref1_email" required type="email" placeholder="referee@email.com"></div>
          <div class="field"><label>Reference 1 relationship *</label><input name="ref1_relationship" required placeholder="e.g. Headteacher, manager, tuition coordinator"></div>
          <div class="field"><label>Reference 2 name</label><input name="ref2_name" placeholder="Second professional referee"></div>
          <div class="field"><label>Reference 2 email</label><input name="ref2_email" type="email" placeholder="referee@email.com"></div>
          <div class="field"><label>Reference 2 relationship</label><input name="ref2_relationship" placeholder="Relationship to you"></div>
          <div class="field full"><label>Can we contact your referees now?</label><select name="contact_referees"><option>Only after interview / with my permission</option><option>Yes, you may contact them now</option><option>Please contact me first</option></select></div>

          <div class="section-title-small">9. Document uploads</div>
          <div class="field full"><label>Upload CV *</label><input name="cv" required type="file" accept=".pdf,.doc,.docx"></div>
          <div class="field full"><label>Upload qualification certificates</label><input name="qualifications" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"></div>
          <div class="field full"><label>Upload DBS certificate</label><input name="dbs" type="file" accept=".pdf,.jpg,.jpeg,.png"></div>
          <div class="field full"><label>Optional supporting documents</label><input name="supporting" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"></div>
          <div class="form-note field full">Sensitive documents are stored privately and are only accessible to authorised staff through the admin inbox.</div>

          <div class="section-title-small">10. Declarations</div>
          <label class="privacy-check field full"><input type="checkbox" name="decl_accurate" value="true" required> <span>I confirm that the information provided is accurate and complete to the best of my knowledge.</span></label>
          <label class="privacy-check field full"><input type="checkbox" name="decl_checks" value="true" required> <span>I understand that any appointment is subject to safer recruitment checks, including identity, right-to-work, references, qualification checks and appropriate DBS checks.</span></label>
          <label class="privacy-check field full"><input type="checkbox" name="decl_disclose" value="true" required> <span>I understand that I must disclose any information relevant to my suitability to work with children during the safer recruitment process.</span></label>
          <label class="privacy-check field full"><input type="checkbox" name="decl_policies" value="true" required> <span>I agree to follow Polygon Pedagogs safeguarding procedures, tutor code of conduct, professional boundaries, reporting expectations and data protection requirements if appointed.</span></label>
          <label class="privacy-check field full"><input type="checkbox" name="decl_privacy" value="true" required> <span>I understand that Polygon Pedagogs will process my application data in line with its <a href="privacy.html" target="_blank" rel="noopener">Privacy Notice</a> and recruitment procedures.</span></label>
        </div>

        <div class="form-status" hidden></div>
        <div class="submit-row">
          <button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" type="submit">Submit Tutor Application</button>
        </div>
      </form>`
  },
  safeguarding: {
    title: 'Safeguarding Statement',
    intro: 'If you need to raise a safeguarding concern, use the contact details on the safeguarding page. This is not an emergency form.',
    html: `
      <div class="form-note"><strong>If a child is in immediate danger, call 999.</strong></div>
      <p style="color:var(--muted);margin-bottom:14px;">Polygon Pedagogs is committed to promoting the safety and welfare of children and young people who access our services. Tutors are expected to follow safeguarding procedures, maintain professional boundaries and report concerns appropriately.</p>
      <div class="feature-list">
        <div class="check"><span class="tick">✓</span>Designated Safeguarding Lead details should appear on the safeguarding page.</div>
        <div class="check"><span class="tick">✓</span>Safeguarding email and phone number should be clearly visible.</div>
        <div class="check"><span class="tick">✓</span>Concerns should be recorded and escalated appropriately.</div>
      </div>
      <div class="submit-row">
        <a class="btn btn-secondary" href="safeguarding.html">Open Safeguarding Page</a>
        <button class="btn btn-primary" onclick="closeModal()">Close</button>
      </div>`
  },
  contact: {
    title: 'Speak to Our Team',
    intro: 'Send a general enquiry. For referrals, parent enquiries or tutor applications, please use the dedicated forms.',
    html: `
      <form data-form="contact">
        <div class="form-grid">
          <div class="field"><label>Name *</label><input name="name" required placeholder="Full name"></div>
          <div class="field"><label>Email *</label><input name="email" required type="email" placeholder="your@email.com"></div>
          <div class="field"><label>I am a...</label><select name="role"><option>School / Council professional</option><option>Parent / Carer</option><option>Tutor</option><option>Other</option></select></div>
          <div class="field"><label>Reason for contact</label><select name="reason"><option>Referral</option><option>Parent enquiry</option><option>Tutor application</option><option>Safeguarding</option><option>General enquiry</option></select></div>
          <div class="field full"><label>Message *</label><textarea name="message" required placeholder="How can we help?"></textarea></div>
        </div>
        <div class="form-status" hidden></div>
        <div class="submit-row"><button class="btn btn-primary" type="submit">Send Message</button></div>
      </form>`
  }
};

function openModal(type) {
  const t = templates[type] || templates.contact;
  document.getElementById('modalTitle').textContent = t.title;
  document.getElementById('modalIntro').textContent = t.intro;
  document.getElementById('modalContent').innerHTML = t.html;
  document.getElementById('modalOverlay').style.display = 'flex';
  bindFormHandlers();
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

function setFormStatus(form, message, kind) {
  const el = form.querySelector('.form-status');
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || '';
  el.className = 'form-status' + (kind ? ' form-status--' + kind : '');
}

function formToJson(form) {
  const data = {};
  const fd = new FormData(form);
  for (const [key, value] of fd.entries()) {
    if (data[key] === undefined) {
      data[key] = value;
    } else if (Array.isArray(data[key])) {
      data[key].push(value);
    } else {
      data[key] = [data[key], value];
    }
  }
  form.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    if (!cb.name) return;
    if (!fd.has(cb.name)) data[cb.name] = [];
  });
  return data;
}

async function submitForm(form) {
  const type = form.getAttribute('data-form');
  const endpoint = API[type];
  if (!endpoint) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalLabel = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
  }
  setFormStatus(form, '', '');

  try {
    let res;
    if (type === 'referral' || type === 'tutor') {
      const fd = new FormData(form);
      res = await fetch(endpoint, { method: 'POST', body: fd });
    } else {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToJson(form)),
      });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Submission failed. Please try again.');
    }

    setFormStatus(form, data.message || 'Submitted successfully. Thank you.', 'success');
    form.reset();
    if (submitBtn) submitBtn.textContent = 'Submitted';
    setTimeout(() => closeModal(), 1800);
  } catch (err) {
    setFormStatus(form, err.message || 'Something went wrong.', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  }
}

function bindFormHandlers() {
  const form = document.querySelector('#modalContent form[data-form]');
  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    submitForm(form);
  });
}

const modalOverlay = document.getElementById('modalOverlay');
if (modalOverlay) {
  modalOverlay.addEventListener('click', function (e) {
    if (e.target.id === 'modalOverlay') closeModal();
  });
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});

/* Cookie banner */
(function initCookieBanner() {
  try {
    if (localStorage.getItem('pp_cookie_consent')) return;
  } catch (_) {
    return;
  }
  const bar = document.createElement('div');
  bar.className = 'cookie-banner';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Cookie notice');
  bar.innerHTML = `
    <p>We use essential cookies to run this website securely (for example, admin login). See our <a href="cookies.html">Cookie Notice</a> and <a href="privacy.html">Privacy Notice</a>.</p>
    <button type="button" class="btn btn-primary" id="cookieAccept">Accept</button>
  `;
  document.body.appendChild(bar);
  document.getElementById('cookieAccept').addEventListener('click', function () {
    try { localStorage.setItem('pp_cookie_consent', 'essential'); } catch (_) {}
    bar.remove();
  });
})();

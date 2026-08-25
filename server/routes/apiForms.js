const express = require('express');
const rateLimit = require('express-rate-limit');
const { referralUpload, tutorUpload } = require('../services/storage');
const {
  asArray,
  cleanString,
  requireFields,
  persistAndNotify,
  multerErrorHandler,
} = require('./formHelpers');

const router = express.Router();

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again later.' },
});

router.use(formLimiter);

router.post('/referral', (req, res) => {
  referralUpload(req, res, async (err) => {
    if (err) return multerErrorHandler(err, req, res, () => {});
    try {
      const body = req.body || {};
      const payload = {
        learner_ref: cleanString(body.learner_ref),
        year_group: cleanString(body.year_group),
        support_types: asArray(body.support_types),
        subjects: asArray(body.subjects),
        hours_per_week: cleanString(body.hours_per_week),
        preferred_start: cleanString(body.preferred_start),
        main_need: cleanString(body.main_need),
        learner_profile: cleanString(body.learner_profile),
        privacy_confirmed: body.privacy_confirmed === 'true' || body.privacy_confirmed === 'on',
      };

      const missing = requireFields(payload, [
        'learner_ref',
        'year_group',
      ]);
      if (missing.length || !payload.privacy_confirmed) {
        return res.status(400).json({
          error: 'Please complete all required fields and confirm privacy consent.',
          missing,
        });
      }

      const result = await persistAndNotify({
        type: 'referral',
        payload,
        submitterName: payload.learner_ref,
        submitterEmail: '',
        files: req.files || [],
      });

      res.json({ ok: true, id: result.id, message: 'Referral submitted successfully.' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Could not save referral. Please try again.' });
    }
  });
});

router.post('/parent-enquiry', express.json(), async (req, res) => {
  try {
    const body = req.body || {};
    const payload = {
      full_name: cleanString(body.full_name),
      email: cleanString(body.email),
      phone: cleanString(body.phone),
      preferred_contact: cleanString(body.preferred_contact),
      address: cleanString(body.address),
      postcode: cleanString(body.postcode),
      child_name: cleanString(body.child_name),
      year_group: cleanString(body.year_group),
      education_situation: cleanString(body.education_situation),
      services: asArray(body.services),
      subjects: cleanString(body.subjects),
      overview: cleanString(body.overview),
      delivery_method: cleanString(body.delivery_method),
      preferred_times: cleanString(body.preferred_times),
      start_preference: cleanString(body.start_preference),
      privacy_confirmed: body.privacy_confirmed === true || body.privacy_confirmed === 'true' || body.privacy_confirmed === 'on',
    };

    const missing = requireFields(payload, [
      'full_name',
      'email',
      'phone',
      'preferred_contact',
      'address',
      'postcode',
      'child_name',
      'year_group',
      'education_situation',
      'overview',
      'delivery_method',
    ]);
    if (missing.length || !payload.privacy_confirmed) {
      return res.status(400).json({
        error: 'Please complete all required fields and confirm privacy consent.',
        missing,
      });
    }

    const result = await persistAndNotify({
      type: 'parent',
      payload,
      submitterName: payload.full_name,
      submitterEmail: payload.email,
    });

    res.json({ ok: true, id: result.id, message: 'Enquiry submitted successfully.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not save enquiry. Please try again.' });
  }
});

router.post('/tutor-application', (req, res) => {
  tutorUpload(req, res, async (err) => {
    if (err) return multerErrorHandler(err, req, res, () => {});
    try {
      const body = req.body || {};
      const filesMap = req.files || {};
      const files = [
        ...(filesMap.cv || []),
        ...(filesMap.qualifications || []),
        ...(filesMap.dbs || []),
        ...(filesMap.supporting || []),
      ];

      if (!filesMap.cv || !filesMap.cv.length) {
        return res.status(400).json({ error: 'Please upload your CV.' });
      }

      const payload = {
        legal_name: cleanString(body.legal_name),
        preferred_name: cleanString(body.preferred_name),
        email: cleanString(body.email),
        phone: cleanString(body.phone),
        address: cleanString(body.address),
        postcode: cleanString(body.postcode),
        town: cleanString(body.town),
        role_type: cleanString(body.role_type),
        age_range: cleanString(body.age_range),
        subjects: asArray(body.subjects),
        other_subjects: cleanString(body.other_subjects),
        travel_distance: cleanString(body.travel_distance),
        highest_qualification: cleanString(body.highest_qualification),
        degree_subject: cleanString(body.degree_subject),
        teaching_qualification: cleanString(body.teaching_qualification),
        experience_years: cleanString(body.experience_years),
        experience_summary: cleanString(body.experience_summary),
        send_experience: cleanString(body.send_experience),
        ap_experience: cleanString(body.ap_experience),
        send_areas: asArray(body.send_areas),
        send_approach: cleanString(body.send_approach),
        dbs_status: cleanString(body.dbs_status),
        dbs_update: cleanString(body.dbs_update),
        safeguarding_training: cleanString(body.safeguarding_training),
        kcsie: cleanString(body.kcsie),
        safeguarding_details: cleanString(body.safeguarding_details),
        right_to_work: cleanString(body.right_to_work),
        visa_summary: cleanString(body.visa_summary),
        ni_number: cleanString(body.ni_number),
        currently_employed: cleanString(body.currently_employed),
        notice_period: cleanString(body.notice_period),
        employment_history: cleanString(body.employment_history),
        availability_slots: asArray(body.availability_slots),
        weekly_availability: cleanString(body.weekly_availability),
        working_pattern: cleanString(body.working_pattern),
        ref1_name: cleanString(body.ref1_name),
        ref1_email: cleanString(body.ref1_email),
        ref1_relationship: cleanString(body.ref1_relationship),
        ref2_name: cleanString(body.ref2_name),
        ref2_email: cleanString(body.ref2_email),
        ref2_relationship: cleanString(body.ref2_relationship),
        contact_referees: cleanString(body.contact_referees),
        declarations_ok:
          (body.decl_accurate === 'true' || body.decl_accurate === 'on') &&
          (body.decl_checks === 'true' || body.decl_checks === 'on') &&
          (body.decl_disclose === 'true' || body.decl_disclose === 'on') &&
          (body.decl_policies === 'true' || body.decl_policies === 'on') &&
          (body.decl_privacy === 'true' || body.decl_privacy === 'on'),
      };

      const missing = requireFields(payload, [
        'legal_name',
        'email',
        'phone',
        'address',
        'postcode',
        'town',
        'role_type',
        'age_range',
        'highest_qualification',
        'experience_years',
        'experience_summary',
        'send_experience',
        'dbs_status',
        'right_to_work',
        'ref1_name',
        'ref1_email',
        'ref1_relationship',
      ]);
      if (missing.length || !payload.declarations_ok) {
        return res.status(400).json({
          error: 'Please complete all required fields and declarations.',
          missing,
        });
      }

      const result = await persistAndNotify({
        type: 'tutor',
        payload,
        submitterName: payload.legal_name,
        submitterEmail: payload.email,
        files,
      });

      res.json({ ok: true, id: result.id, message: 'Tutor application submitted successfully.' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Could not save application. Please try again.' });
    }
  });
});

router.post('/contact', express.json(), async (req, res) => {
  try {
    const body = req.body || {};
    const payload = {
      name: cleanString(body.name),
      email: cleanString(body.email),
      role: cleanString(body.role),
      reason: cleanString(body.reason),
      message: cleanString(body.message),
    };

    const missing = requireFields(payload, ['name', 'email', 'message']);
    if (missing.length) {
      return res.status(400).json({ error: 'Please provide your name, email and message.', missing });
    }

    const result = await persistAndNotify({
      type: 'contact',
      payload,
      submitterName: payload.name,
      submitterEmail: payload.email,
    });

    res.json({ ok: true, id: result.id, message: 'Message sent successfully.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not send message. Please try again.' });
  }
});

module.exports = router;

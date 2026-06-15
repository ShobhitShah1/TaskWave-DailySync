import { getAuthApiBaseUrl } from '@Constants/AuthConfig';
import { AlarmSession } from '@Types/Alarm';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '10.0.2.2']);
const LEGACY_PRODUCTION_UPLOAD = /^https?:\/\/(?:www\.)?nirvanatechlabs\.in\/uploads\/(.+)$/i;

export const resolveAlarmAudioUrl = (value: string | null | undefined) => {
  const uri = value?.trim();
  if (!uri || /^(file|content):\/\//i.test(uri)) {
    return uri || '';
  }

  const baseUrl = getAuthApiBaseUrl().replace(/\/+$/, '');
  const legacyUploadMatch = uri.match(LEGACY_PRODUCTION_UPLOAD);
  if (legacyUploadMatch?.[1]) {
    return `${baseUrl}/uploads/${legacyUploadMatch[1]}`;
  }

  const base = new URL(baseUrl);

  if (/^https?:\/\//i.test(uri)) {
    const parsed = new URL(uri);
    const basePath = base.pathname.replace(/\/+$/, '');

    if (
      parsed.hostname === base.hostname &&
      basePath &&
      !parsed.pathname.startsWith(`${basePath}/`) &&
      parsed.pathname.startsWith('/uploads/')
    ) {
      return `${baseUrl}${parsed.pathname}${parsed.search}`;
    }

    if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
      return uri;
    }

    const path = parsed.pathname.startsWith(base.pathname)
      ? parsed.pathname.slice(base.pathname.length)
      : parsed.pathname;
    return `${baseUrl}/${path.replace(/^\/+/, '')}${parsed.search}`;
  }

  if (uri.startsWith('//')) {
    return `${base.protocol}${uri}`;
  }

  if (uri.startsWith(base.pathname)) {
    return `${base.origin}${uri}`;
  }

  return `${baseUrl}/${uri.replace(/^\/+/, '')}`;
};

export const normalizeAlarmSessionAudioUrls = (session: AlarmSession): AlarmSession => {
  return {
    ...session,
    mainMemoUri: session.mainMemoUri ? resolveAlarmAudioUrl(session.mainMemoUri) : null,
    ownerVoiceNotes: session.ownerVoiceNotes.map((note) => ({
      ...note,
      uri: resolveAlarmAudioUrl(note.uri),
    })),
    members: session.members.map((member) => ({
      ...member,
      responseMemoUri: member.responseMemoUri ? resolveAlarmAudioUrl(member.responseMemoUri) : null,
    })),
  };
};

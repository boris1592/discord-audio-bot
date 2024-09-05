use reqwest::Client as HttpClient;
use songbird::{
    input::{AuxMetadataError, Compose, YoutubeDl},
    tracks::TrackHandle,
};
use std::{collections::VecDeque, sync::Arc};

#[derive(Clone)]
pub struct QueueEntry {
    pub url: Arc<str>,
    pub name: Arc<str>,
}

#[derive(Default, Clone)]
pub struct Queue {
    pub current: Option<(QueueEntry, TrackHandle)>,
    pub queue: VecDeque<QueueEntry>,
}

impl QueueEntry {
    pub async fn new(
        url: impl Into<Arc<str>>,
        client: HttpClient,
    ) -> Result<Self, AuxMetadataError> {
        let url = url.into();
        let mut ytdl = YoutubeDl::new(client, url.to_string());
        let name = ytdl.aux_metadata().await?.title.unwrap().into();
        Ok(Self { url, name })
    }

    pub fn format(&self) -> String {
        format!("[{}]({})", self.name, self.url)
    }
}

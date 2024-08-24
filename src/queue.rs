use reqwest::Client as HttpClient;
use songbird::{
    input::{AuxMetadataError, Compose, YoutubeDl},
    tracks::TrackHandle,
};
use std::collections::VecDeque;

#[derive(Clone)]
pub struct QueueEntry {
    pub url: Box<str>,
    pub name: Box<str>,
}

impl QueueEntry {
    pub async fn new(url: Box<str>, client: HttpClient) -> Result<Self, AuxMetadataError> {
        let mut ytdl = YoutubeDl::new(client, url.clone().into());
        let name = ytdl.aux_metadata().await?.title.unwrap().into();
        Ok(Self { url, name })
    }

    pub fn format(&self) -> String {
        format!("[{}]({})", self.name, self.url)
    }
}

#[derive(Default, Clone)]
pub struct Queue {
    pub current: Option<(QueueEntry, TrackHandle)>,
    pub queue: VecDeque<QueueEntry>,
}
